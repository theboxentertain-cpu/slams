import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Keep Vite's asset URL transform static, while loading PDF support only on demand.
export default pdfWorkerUrl;
