import { ingest, validateFile } from "../utils/ingestion/index.js";
import { ok, badRequest, serverError } from "../utils/response";
import { rateLimit } from "../utils/rateLimit";

export async function POST(request) {
  const rl = rateLimit({ max: 10, windowMs: 60000 });
  const limit = rl(request);
  if (limit) return limit;

  try {
    const body = await request.json();
    const { buffer: b64, url, name } = body;

    if (!b64 && !url) return badRequest("buffer or url required");

    let buffer;
    if (b64) buffer = Buffer.from(b64, "base64");
    else {
      const resp = await fetch(url);
      buffer = Buffer.from(await resp.arrayBuffer());
    }

    const fname = name || "presentation.pptx";

    const safety = validateFile(fname, buffer);
    if (!safety.valid) return badRequest(safety.error);

    const result = await ingest(buffer, fname);

    return ok({
      text: result.text,
      slides: result.slides || 1,
      format: result.format || fname.split(".").pop(),
      words: result.text?.split(/\s+/).length || 0,
      warning: result.warning || null,
    });
  } catch (error) {
    console.error("POST /api/presentations:", error);
    return serverError(error);
  }
}
