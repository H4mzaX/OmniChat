import { getMediaInfo, transcribeAudio } from "../utils/ingestion/media.js";
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

    const fname = name || "audio.mp3";

    if (action === "info") {
      const info = await getMediaInfo(buffer, fname);
      return ok({ info });
    }
    if (action === "transcribe") {
      const transcript = await transcribeAudio(buffer);
      return ok(transcript);
    }
    if (action === "analyze") {
      const info = await getMediaInfo(buffer, fname);
      const transcript = await transcribeAudio(buffer);
      return ok({ info, transcript });
    }

    return badRequest("Unknown action. Use: info, transcribe, analyze");
  } catch (error) {
    console.error("POST /api/audio:", error);
    return serverError(error);
  }
}
