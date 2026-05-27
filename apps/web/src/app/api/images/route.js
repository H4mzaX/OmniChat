import { analyzeImage, getImageBase64, preprocessForOcr, ocrImage } from "../utils/ingestion/index.js";
import { ok, badRequest, serverError } from "../utils/response";
import { rateLimit } from "../utils/rateLimit";

export async function POST(request) {
  const rl = rateLimit({ max: 30, windowMs: 60000 });
  const limit = rl(request);
  if (limit) return limit;

  try {
    const body = await request.json();
    const { action, buffer: b64, url } = body;
    if (!b64 && !url) return badRequest("buffer or url required");

    let buffer;
    if (b64) buffer = Buffer.from(b64, "base64");
    else {
      const resp = await fetch(url);
      buffer = Buffer.from(await resp.arrayBuffer());
    }

    const name = body.name || "image.png";
    const mime = body.mime || name.match(/\.(.+)$/)?.[0] || "image/png";

    if (action === "analyze") {
      const analysis = await analyzeImage(buffer, mime);
      const base64 = await getImageBase64(buffer, mime);
      return ok({ ...analysis, base64, dataUri: base64 });
    }
    if (action === "ocr") {
      const preprocessed = await preprocessForOcr(buffer);
      const ocr = await ocrImage(preprocessed);
      return ok({ text: ocr.text, confidence: ocr.confidence, lines: ocr.lines, words: ocr.words });
    }
    if (action === "describe") {
      const analysis = await analyzeImage(buffer, mime);
      return ok({
        format: analysis.format,
        dimensions: `${analysis.width}x${analysis.height}`,
        aspect: analysis.aspectRatio,
        megapixels: analysis.megapixels,
        note: "Detailed image description requires vision model API call",
      });
    }

    return badRequest("Unknown action. Use: analyze, ocr, describe");
  } catch (error) {
    console.error("POST /api/images:", error);
    return serverError(error);
  }
}
