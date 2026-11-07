import { Unzip, UnzipInflate } from "fflate";
import { MAX_SIDE_BYTES, MAX_SIDE_CHARS, MAX_SIDE_LINES, sideLines } from "./actor-sides-model";

export const MAX_SOURCE_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_EXTRACTED_SOURCE_CHARS = 200000;
const MAX_XML_BYTES = 2 * 1024 * 1024;
const MAX_ZIP_EXPANDED = 30 * 1024 * 1024;
export type ScriptSourceKind = "legacy_text" | "paste" | "txt" | "pdf" | "docx";
export interface PreparedScriptSource {
  file: File;
  kind: "txt" | "pdf" | "docx";
  name: string;
  sha256: string;
  content: string;
}
const fallback = " Paste the original text instead.";
const fail = (message: string): never => {
  throw new Error(message + fallback);
};

export function validateExtractedScript(content: string): string {
  if (!content.trim()) return fail("No readable text was found in this document.");
  if (
    content.length > MAX_SIDE_CHARS ||
    new TextEncoder().encode(content).byteLength > MAX_SIDE_BYTES ||
    sideLines(content).length > MAX_SIDE_LINES
  )
    return fail(
      "This document exceeds one side's 25,000 characters / 60 KB / 400 lines. Use a smaller excerpt.",
    );
  if (content.includes("\u0000")) return fail("This document contains unsupported binary text.");
  return content;
}

function validateExtractedSource(content: string): string {
  if (!content.trim()) return fail("No readable text was found in this document.");
  if (
    content.length > MAX_EXTRACTED_SOURCE_CHARS ||
    new TextEncoder().encode(content).length > 500000 ||
    sideLines(content).length > 5000
  )
    return fail(
      "This document exceeds the 200,000-character / 5,000-line preview limit. Import a smaller document.",
    );
  if (content.includes("\u0000")) return fail("This document contains unsupported binary text.");
  return content;
}

async function fileBytes(file: Blob): Promise<Uint8Array<ArrayBuffer>> {
  if (typeof file.arrayBuffer === "function") return new Uint8Array(await file.arrayBuffer());
  // FileReader also supports older Android WebViews.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("This file could not be read." + fallback));
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.readAsArrayBuffer(file);
  });
}

export async function scriptSourceSha256(file: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await fileBytes(file));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Validate the ZIP directory before allowing any document member to inflate. */
function inspectDocxZip(bytes: Uint8Array): Map<string, number> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  const first = Math.max(0, bytes.length - 65557);
  while (end >= first && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < first) return fail("This DOCX archive is invalid.");
  if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true))
    return fail("Split DOCX archives are unsupported.");
  const count = view.getUint16(end + 10, true);
  const directorySize = view.getUint32(end + 12, true);
  let at = view.getUint32(end + 16, true);
  if (!count || count > 1000 || at + directorySize !== end)
    return fail("This DOCX archive exceeds safe import limits.");
  const names = new Map<string, number>();
  let expanded = 0;
  for (let index = 0; index < count; index++) {
    if (at + 46 > end || view.getUint32(at, true) !== 0x02014b50)
      return fail("This DOCX directory is invalid.");
    const flags = view.getUint16(at + 8, true);
    const method = view.getUint16(at + 10, true);
    const compressed = view.getUint32(at + 20, true);
    const original = view.getUint32(at + 24, true);
    const nameLength = view.getUint16(at + 28, true);
    const next =
      at + 46 + nameLength + view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
    const local = view.getUint32(at + 42, true);
    if (next > end || local + 30 > bytes.length) return fail("This DOCX directory is invalid.");
    const name = new TextDecoder("utf-8", { fatal: true }).decode(
      bytes.subarray(at + 46, at + 46 + nameLength),
    );
    expanded += original;
    if (
      flags & 1 ||
      ![0, 8].includes(method) ||
      name.startsWith("/") ||
      name.split(/[\\/]/).includes("..") ||
      names.has(name) ||
      expanded > MAX_ZIP_EXPANDED ||
      original > 10 * 1024 * 1024 ||
      original > Math.max(1024 * 1024, compressed * 200)
    )
      return fail("This DOCX is encrypted or exceeds safe archive limits.");
    if (view.getUint32(local, true) !== 0x04034b50 || view.getUint16(local + 8, true) !== method)
      return fail("This DOCX archive is inconsistent.");
    const localNameLength = view.getUint16(local + 26, true);
    const localExtraLength = view.getUint16(local + 28, true);
    const localName = new TextDecoder().decode(
      bytes.subarray(local + 30, local + 30 + localNameLength),
    );
    if (localName !== name || local + 30 + localNameLength + localExtraLength + compressed > at)
      return fail("This DOCX archive is inconsistent.");
    names.set(name, original);
    at = next;
  }
  if (at !== end || !names.has("word/document.xml") || !names.has("[Content_Types].xml"))
    return fail("This file is not a supported DOCX document.");
  return names;
}

export function extractDocxText(bytes: Uint8Array): string {
  const directory = inspectDocxZip(bytes);
  const wanted = new Set(["word/document.xml", "[Content_Types].xml"]);
  for (const name of wanted) {
    if ((directory.get(name) ?? 0) > MAX_XML_BYTES)
      return fail("This DOCX document is too complex.");
  }
  const members = new Map<string, Uint8Array>();
  let memberCount = 0;
  const unzip = new Unzip((file) => {
    memberCount++;
    if (memberCount > 1000 || !directory.has(file.name)) fail("This DOCX archive is inconsistent.");
    if (!wanted.has(file.name)) return;
    const chunks: Uint8Array[] = [];
    let size = 0;
    file.ondata = (error, chunk, final) => {
      if (error) throw error;
      size += chunk.length;
      if (size > MAX_XML_BYTES || size > (directory.get(file.name) ?? 0)) {
        file.terminate();
        fail("This DOCX document exceeds safe expansion limits.");
      }
      chunks.push(chunk);
      if (final) {
        const result = new Uint8Array(size);
        let offset = 0;
        for (const part of chunks) {
          result.set(part, offset);
          offset += part.length;
        }
        members.set(file.name, result);
      }
    };
    file.start();
  });
  unzip.register(UnzipInflate);
  // Bound each inflater push, including deliberately misleading ZIP size metadata.
  for (let offset = 0; offset < bytes.length; offset += 1024)
    unzip.push(bytes.subarray(offset, offset + 1024), offset + 1024 >= bytes.length);
  const xml = members.get("word/document.xml");
  const contentTypes = members.get("[Content_Types].xml");
  if (!xml || !contentTypes) return fail("The DOCX document body could not be read.");
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const source = decoder.decode(xml);
  const types = decoder.decode(contentTypes);
  if (/<!DOCTYPE|<!ENTITY/i.test(source + types) || /macroEnabled/i.test(types))
    return fail("Active or entity-based DOCX documents are unsupported.");
  const document = new DOMParser().parseFromString(source, "application/xml");
  if (
    document.getElementsByTagName("parsererror").length ||
    document.getElementsByTagNameNS("*", "altChunk").length
  )
    return fail("The DOCX document contains unsupported embedded content.");
  const namespace = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const body = document.getElementsByTagNameNS(namespace, "body")[0];
  if (!body) return fail("The DOCX document body is missing.");
  const text = (node: Element): string => {
    if (node.namespaceURI === namespace) {
      if (node.localName === "del" || node.localName === "drawing") return "";
      if (node.localName === "t") return node.textContent ?? "";
      if (node.localName === "tab") return "\t";
      if (node.localName === "br" || node.localName === "cr") return "\n";
    }
    return Array.from(node.children).map(text).join("");
  };
  return validateExtractedSource(
    Array.from(body.getElementsByTagNameNS(namespace, "p")).map(text).join("\n"),
  );
}

async function extractPdfText(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  if (!new TextDecoder().decode(bytes.subarray(0, 1024)).includes("%PDF-"))
    return fail("This file does not have a valid PDF header.");
  const [pdfjs, { default: pdfWorkerUrl }] = await Promise.all([
    import("pdfjs-dist"),
    import("./actor-pdf-worker"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const task = pdfjs.getDocument({
    data: bytes,
    useWorkerFetch: false,
    useWasm: false,
    disableFontFace: true,
    useSystemFonts: false,
    disableAutoFetch: true,
    disableStream: true,
    enableXfa: false,
    stopAtErrors: true,
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      void task.destroy();
      reject(new Error("PDF extraction timed out." + fallback));
    }, 20000);
  });
  try {
    return await Promise.race([
      timeout,
      (async () => {
        const pdf = await task.promise;
        if (pdf.numPages > 100) return fail("Import at most 100 PDF pages at a time.");
        const pages: string[] = [];
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();
          let pageText = "";
          for (const item of content.items) {
            if (!("str" in item)) continue;
            pageText += item.str + (item.hasEOL ? "\n" : " ");
            if (pageText.length > MAX_EXTRACTED_SOURCE_CHARS)
              return fail("This PDF exceeds the document preview limit.");
          }
          pages.push(pageText.trimEnd());
          if (pages.some((text) => text.trim())) validateExtractedSource(pages.join("\n"));
          page.cleanup();
        }
        return validateExtractedSource(pages.join("\n"));
      })(),
    ]);
  } catch (error) {
    if (error instanceof Error && error.name === "PasswordException")
      return fail("Encrypted PDFs cannot be imported.");
    if (error instanceof Error && error.message.includes(fallback.trim())) throw error;
    return fail(
      "This PDF could not be read. Scanned PDFs need selectable text or OCR before import.",
    );
  } finally {
    clearTimeout(timer);
    await task.destroy();
  }
}

/** Purely local extraction. No source upload happens until the actor approves the preview. */
export async function prepareScriptSource(file: File): Promise<PreparedScriptSource> {
  const kind = file.name.split(".").pop()?.toLowerCase();
  if (
    !["txt", "pdf", "docx"].includes(kind ?? "") ||
    !file.size ||
    file.size > MAX_SOURCE_FILE_BYTES
  )
    return fail("Choose a TXT, PDF or DOCX document of up to 10 MB.");
  const bytes = await fileBytes(file);
  let content: string;
  try {
    content =
      kind === "txt"
        ? validateExtractedSource(new TextDecoder("utf-8", { fatal: true }).decode(bytes))
        : kind === "docx"
          ? extractDocxText(bytes)
          : await extractPdfText(bytes);
  } catch (error) {
    if (error instanceof Error && error.message.includes(fallback.trim())) throw error;
    return fail("This document is malformed or uses an unsupported encoding.");
  }
  // PDF.js may transfer its input buffer to the worker, so hash a fresh file read.
  const sha256 = await scriptSourceSha256(file);
  return {
    file,
    kind: kind as PreparedScriptSource["kind"],
    name: file.name.slice(0, 255),
    sha256,
    content,
  };
}
