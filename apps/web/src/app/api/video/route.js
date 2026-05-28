import { analyzeVideo, getMediaInfo, extractVideoFrames } from "../utils/ingestion/media.js";
import { ok, badRequest, serverError } from "../utils/response.js";
import { rateLimit } from "../utils/rateLimit.js";

export async function POST(request) {
  const rl = rateLimit({ max: 5, windowMs: 60000 });
  const limit = rl(request);
  if (limit) return limit;

  try {
    const body = await request.json();
    const { action, buffer: b64, url, name } = body;

    if (!b64 && !url) return badRequest("buffer or url required");

    let buffer;
    if (b64) buffer = Buffer.from(b64, "base64");
    else {
      const resp = await fetch(url);
      buffer = Buffer.from(await resp.arrayBuffer());
    }

    const fname = name || "video.mp4";

    if (action === "analyze") {
      const result = await analyzeVideo(buffer);
      return ok(result);
    }
    if (action === "info") {
      const info = await getMediaInfo(buffer, fname);
      return ok({ info });
    }
    if (action === "frames") {
      const count = body.count || 8;
      const frames = await extractVideoFrames(buffer, count);
      return ok({ frames, count: frames.length });
    }

    return badRequest("Unknown action. Use: analyze, info, frames");
  } catch (error) {
    console.error("POST /api/video:", error);
    return serverError(error);
  }
}
