import { ingest, validateFile } from "../utils/ingestion/index.js";
import { parsePdf, parseDocx, parseDoc } from "../utils/ingestion/parsers.js";
import { ocrImage } from "../utils/ingestion/ocr.js";
import { ok, badRequest, serverError } from "../utils/response";
import { rateLimit } from "../utils/rateLimit";

export async function POST(request) {
  const rl = rateLimit({ max: 20, windowMs: 60000 });
  const limit = rl(request);
  if (limit) return limit;

  try {
    const body = await request.json();
    const { action, buffer: b64, url, name } = body;
    let buffer;

    if (b64) buffer = Buffer.from(b64, "base64");
    else if (url) {
      const resp = await fetch(url);
      buffer = Buffer.from(await resp.arrayBuffer());
    } else return badRequest("buffer or url required");

    const fname = name || "document.pdf";

    if (action === "parse") {
      const result = await ingest(buffer, fname);
      return ok(result);
    }
    if (action === "ocr") {
      const safety = validateFile(fname, buffer);
      if (!safety.valid) return badRequest(safety.error);
      const ocr = await ocrImage(buffer);
      return ok({ text: ocr.text, confidence: ocr.confidence, paragraphs: ocr.paragraphs });
    }
    if (action === "index") {
      const result = await ingest(buffer, fname, { ocr: true });
      return ok({
        text: result.text,
        pages: result.pages,
        metadata: result.metadata,
        chars: result.text?.length || 0,
        words: result.text?.split(/\s+/).length || 0,
        indexed: true,
      });
    }

    return badRequest("Unknown action. Use: parse, ocr, index");
  } catch (error) {
    console.error("POST /api/docs:", error);
    return serverError(error);
  }
}
