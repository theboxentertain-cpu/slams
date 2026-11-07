#!/usr/bin/env python3
"""Run against `npm run dev -- --host 127.0.0.1 --port 5184`.

Requires Python Playwright and a Chromium executable. Uses synthetic documents,
an isolated same-origin page, and the actual Vite browser module/worker. This is
desktop Chromium evidence at a mobile viewport, not a physical Android test.
"""

import argparse
import asyncio
import base64
import hashlib
import io
import json
from pathlib import Path
from urllib.parse import urlsplit
import zipfile

from playwright.async_api import async_playwright


def synthetic_pdf(text=True):
    stream = b"BT /F1 12 Tf 72 720 Td (SAM: Stay.) Tj 0 -20 Td (LILA: I will.) Tj ET" if text else b""
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    ]
    data = bytearray(b"%PDF-1.7\n")
    offsets = [0]
    for index, obj in enumerate(objects, 1):
        offsets.append(len(data))
        data.extend(f"{index} 0 obj\n".encode() + obj + b"\nendobj\n")
    xref = len(data)
    data.extend(f"xref\n0 {len(offsets)}\n0000000000 65535 f \n".encode())
    for offset in offsets[1:]:
        data.extend(f"{offset:010d} 00000 n \n".encode())
    data.extend(f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
    return bytes(data)


def synthetic_docx():
    data = io.BytesIO()
    with zipfile.ZipFile(data, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", "<Types/>")
        archive.writestr("word/document.xml", '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>SAM: Stay.</w:t></w:r></w:p><w:p><w:r><w:t>ليلى: حاضر</w:t></w:r></w:p></w:body></w:document>')
    return data.getvalue()


async def run(args):
    origin_parts = urlsplit(args.base_url)
    origin = f"{origin_parts.scheme}://{origin_parts.netloc}"
    requests, blocked, checks = [], [], []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(executable_path=args.chromium, headless=True, args=["--no-sandbox"])
        try:
            page = await browser.new_page(viewport={"width": 393, "height": 851})

            async def isolate(route):
                if route.request.url.startswith(origin + "/"):
                    await route.continue_()
                else:
                    blocked.append(route.request.url)
                    await route.abort()

            await page.route("**/*", isolate)
            await page.route("**/__script_import_smoke", lambda route: route.fulfill(content_type="text/html", body="<!doctype html><title>Local script import smoke</title>"))
            await page.goto(origin + "/__script_import_smoke")
            page.on("request", lambda request: requests.append(request.url))
            fixtures = [
                ("scene.pdf", synthetic_pdf(), "SAM: Stay.\nLILA: I will."),
                ("scene.docx", synthetic_docx(), "SAM: Stay.\nليلى: حاضر"),
                ("scene.txt", "SCENE\r\nمريم: ابقى\r\n".encode(), "SCENE\r\nمريم: ابقى\r\n"),
                ("scanned.pdf", synthetic_pdf(False), None),
                ("malformed.pdf", b"not a PDF", None),
            ]
            for name, raw, expected in fixtures:
                result = await page.evaluate("""async ({name, data}) => {
                    const {prepareScriptSource} = await import('/src/lib/actor-script-import.ts');
                    try {
                      const source = await prepareScriptSource(new File([Uint8Array.from(atob(data), c => c.charCodeAt(0))], name));
                      return {content: source.content, kind: source.kind, sha256: source.sha256};
                    } catch (error) { return {error: error.message}; }
                }""", {"name": name, "data": base64.b64encode(raw).decode()})
                if expected is None:
                    assert "error" in result and "Paste the original text" in result["error"], result
                    checks.append({"fixture": name, "passed": True, "rejected": result["error"]})
                else:
                    assert result.get("content") == expected, result
                    assert result.get("sha256") == hashlib.sha256(raw).hexdigest(), result
                    checks.append({"fixture": name, "passed": True, "kind": result["kind"], "sha256": result["sha256"]})
            external = [url for url in requests if not url.startswith(origin + "/")]
            assert not external and not blocked, {"external": external, "blocked": blocked}
            return {"passed": True, "environment": "desktop Chromium, mobile viewport; no Android device", "userAgent": await page.evaluate("navigator.userAgent"), "checks": checks, "externalRequests": external, "blockedRequests": blocked}
        finally:
            await browser.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://127.0.0.1:5184")
    parser.add_argument("--chromium", default="/usr/bin/chromium")
    parser.add_argument("--output", default="/tmp/slams-script-import-browser-smoke.json")
    options = parser.parse_args()
    report = asyncio.run(run(options))
    Path(options.output).write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report, ensure_ascii=False))
