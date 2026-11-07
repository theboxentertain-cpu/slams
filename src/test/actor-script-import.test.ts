import { webcrypto } from "node:crypto";
import { strToU8, zipSync } from "fflate";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  extractDocxText,
  MAX_SOURCE_FILE_BYTES,
  prepareScriptSource,
  validateExtractedScript,
} from "@/lib/actor-script-import";

const pdf = vi.hoisted(() => ({ getDocument: vi.fn(), destroy: vi.fn() }));
vi.mock("pdfjs-dist", () => ({ GlobalWorkerOptions: {}, getDocument: pdf.getDocument }));
vi.mock("pdfjs-dist/build/pdf.worker.min.mjs?url", () => ({ default: "/local/pdf.worker.mjs" }));
const word = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const document = (body: string) =>
  `<w:document xmlns:w="${word}"><w:body>${body}</w:body></w:document>`;
const docx = (xml: string, types = "<Types/>") =>
  zipSync({
    "[Content_Types].xml": strToU8(types),
    "word/document.xml": strToU8(xml),
  });
beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  pdf.destroy.mockResolvedValue(undefined);
  pdf.getDocument.mockReturnValue({
    promise: Promise.resolve({
      numPages: 1,
      getPage: async () => ({
        getTextContent: async () => ({
          items: [
            { str: "SAM: Stay.", hasEOL: true },
            { str: "ليلى: حاضر", hasEOL: true },
          ],
        }),
        cleanup: vi.fn(),
      }),
    }),
    destroy: pdf.destroy,
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("Private script document import", () => {
  it("preserves exact UTF-8 TXT content and fingerprints the original bytes", async () => {
    const file = new File(["SCENE\r\nمريم: ابقى\r\n"], "scene.txt");
    const source = await prepareScriptSource(file);
    expect(source.content).toBe("SCENE\r\nمريم: ابقى\r\n");
    expect(source.file).toBe(file);
    expect(source.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(source).toMatchObject({ name: "scene.txt", kind: "txt" });
  });
  it("retains a larger original for actor-selected excerpts within bounded preview limits", async () => {
    const text = Array.from({ length: 500 }, (_, index) => `${index + 1}: ${"a".repeat(95)}`).join(
      "\n",
    );
    const source = await prepareScriptSource(new File([text], "whole-script.txt"));
    expect(source.content).toBe(text);
    expect(() => validateExtractedScript(source.content)).toThrow(/one side/);
    await expect(
      prepareScriptSource(new File(["a".repeat(200001)], "too-big.txt")),
    ).rejects.toThrow(/preview limit/);
  });
  it("extracts DOCX paragraphs, explicit breaks and tabs as plain multilingual text", () => {
    const bytes = docx(
      document(
        "<w:p><w:r><w:t>SAM: Stay.</w:t><w:tab/><w:t>Now.</w:t></w:r></w:p><w:p><w:r><w:t>ليلى: حاضر</w:t><w:br/><w:t>&lt;script&gt;literal&lt;/script&gt;</w:t></w:r></w:p>",
      ),
    );
    expect(extractDocxText(bytes)).toBe("SAM: Stay.\tNow.\nليلى: حاضر\n<script>literal</script>");
  });
  it("rejects broken, entity-bearing, macro-enabled and oversized DOCX archives", () => {
    expect(() => extractDocxText(strToU8("not a zip"))).toThrow(/invalid/);
    expect(() =>
      extractDocxText(
        docx(
          '<!DOCTYPE x [<!ENTITY x SYSTEM "https://example.test/secret">]>' +
            document("<w:p><w:r><w:t>&x;</w:t></w:r></w:p>"),
        ),
      ),
    ).toThrow(/entity/);
    expect(() => extractDocxText(docx(document("<w:p/>"), "<macroEnabled/>"))).toThrow(/Active/);
    expect(() => extractDocxText(docx(document("A".repeat(2 * 1024 * 1024))))).toThrow(
      /safe archive|complex/,
    );
    expect(() => extractDocxText(docx(document("<w:altChunk/>")))).toThrow(/embedded/);
  });
  it("rejects traversal paths and ZIP expansion attacks before extraction", () => {
    expect(() =>
      extractDocxText(
        zipSync({
          "[Content_Types].xml": strToU8("<Types/>"),
          "word/document.xml": strToU8(document("<w:p/>")),
          "../outside": new Uint8Array(10),
        }),
      ),
    ).toThrow(/safe archive/);
    expect(() => extractDocxText(docx(document("a".repeat(1500000))))).toThrow(/safe archive/);
  });
  it("applies all original side bounds and refuses binary or non-UTF-8 TXT", async () => {
    expect(() => validateExtractedScript("x".repeat(25001))).toThrow(/25,000/);
    expect(() => validateExtractedScript("x\n".repeat(400))).toThrow(/400 lines/);
    expect(() => validateExtractedScript("漢".repeat(21000))).toThrow(/25,000/);
    expect(() => validateExtractedScript("A\0B")).toThrow(/binary/);
    await expect(
      prepareScriptSource(new File([new Uint8Array([0xff])], "bad.txt")),
    ).rejects.toThrow(/encoding/);
    const large = new File(["x"], "big.pdf");
    Object.defineProperty(large, "size", { value: MAX_SOURCE_FILE_BYTES + 1 });
    await expect(prepareScriptSource(large)).rejects.toThrow(/10 MB/);
    await expect(prepareScriptSource(new File(["x"], "run.html"))).rejects.toThrow(
      /TXT, PDF or DOCX/,
    );
  });
  it("extracts PDF text in a bundled local worker without any document URL", async () => {
    const source = await prepareScriptSource(new File(["%PDF-1.7\nfixture"], "scene.pdf"));
    expect(source.content).toBe("SAM: Stay.\nليلى: حاضر");
    expect(pdf.getDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        useWorkerFetch: false,
        useWasm: false,
        enableXfa: false,
        disableFontFace: true,
        disableAutoFetch: true,
      }),
    );
    expect(pdf.getDocument.mock.calls[0]?.[0]).not.toHaveProperty("url");
    expect(pdf.destroy).toHaveBeenCalledOnce();
  });
  it("rejects malformed, scanned, encrypted and excessive-page PDFs with a paste fallback", async () => {
    await expect(prepareScriptSource(new File(["not pdf"], "bad.pdf"))).rejects.toThrow(/header/);
    pdf.getDocument.mockReturnValueOnce({
      promise: Promise.resolve({ numPages: 101 }),
      destroy: pdf.destroy,
    });
    await expect(prepareScriptSource(new File(["%PDF-1.7"], "big.pdf"))).rejects.toThrow(
      /100 PDF pages/,
    );
    pdf.getDocument.mockReturnValueOnce({
      promise: Promise.resolve({
        numPages: 1,
        getPage: async () => ({ getTextContent: async () => ({ items: [] }), cleanup: vi.fn() }),
      }),
      destroy: pdf.destroy,
    });
    await expect(prepareScriptSource(new File(["%PDF-1.7"], "scan.pdf"))).rejects.toThrow(
      /No readable text.*Paste/,
    );
    const password = new Error("password");
    password.name = "PasswordException";
    pdf.getDocument.mockImplementationOnce(() => ({
      promise: Promise.reject(password),
      destroy: pdf.destroy,
    }));
    await expect(prepareScriptSource(new File(["%PDF-1.7"], "locked.pdf"))).rejects.toThrow(
      /Encrypted.*Paste/,
    );
  });
});
