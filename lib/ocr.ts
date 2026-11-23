import path from "node:path";
import type { ProofFile } from "@/lib/proof";

/**
 * Reads the text on an uploaded receipt or certificate.
 *
 * Photos and screenshots: Tesseract OCR (open source, free) running inside this server.
 * PDFs: the text layer is read directly. A scanned PDF with no text layer returns "".
 *
 * Nothing is sent to an outside AI service, and nothing is billed per check.
 */

type OcrWorker = { recognize: (image: Buffer) => Promise<{ data: { text: string } }> };

let workerPromise: Promise<OcrWorker> | null = null;

async function ocrWorker(): Promise<OcrWorker> {
  workerPromise ??= (async () => {
    const { createWorker } = await import("tesseract.js");
    const langPath = path.join(process.cwd(), "node_modules", "@tesseract.js-data", "eng", "4.0.0_best_int");
    return (await createWorker("eng", 1, { langPath, gzip: true, cacheMethod: "none" })) as unknown as OcrWorker;
  })().catch((error: unknown) => {
    workerPromise = null;
    throw error;
  });
  return workerPromise;
}

export async function readDocumentText(file: ProofFile): Promise<string> {
  if (file.contentType === "application/pdf") return readPdfText(file.bytes);
  const worker = await ocrWorker();
  const result = await worker.recognize(file.bytes);
  return result.data.text ?? "";
}

async function readPdfText(bytes: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}
