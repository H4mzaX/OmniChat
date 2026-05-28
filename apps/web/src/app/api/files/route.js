import { ingest, validateFile, detectMime } from "../utils/ingestion/index.js";
import { ok, badRequest, serverError } from "../utils/response.js";
import { rateLimit } from "../utils/rateLimit.js";

const filesStore = new Map();
let fileId = 0;

export async function POST(request) {
  const rl = rateLimit({ max: 30, windowMs: 60000 });
  const limit = rl(request);
  if (limit) return limit;

  try {
    const ct = request.headers.get("content-type") || "";
    let buffer, name, options = {};

    if (ct.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!file) return badRequest("No file provided");
      buffer = Buffer.from(await file.arrayBuffer());
      name = file.name;
      options = { ocr: form.get("ocr") === "true", transcribe: form.get("transcribe") === "true", extractFrames: form.get("frames") !== "false" };
    } else {
      const body = await request.json();
      if (body.base64) buffer = Buffer.from(body.base64, "base64");
      else if (body.url) {
        const resp = await fetch(body.url);
        buffer = Buffer.from(await resp.arrayBuffer());
      } else return badRequest("Provide file, base64, or url");
      name = body.name || "unnamed";
      options = body.options || {};
    }

    const safety = validateFile(name, buffer);
    if (!safety.valid) return badRequest(safety.error);

    const result = await ingest(buffer, name, options);
    const id = ++fileId;
    filesStore.set(id, { ...result, rawBuffer: buffer.toString("base64").slice(0, 1000) + "..." });

    return ok({ id, ...result }, 201);
  } catch (error) {
    console.error("POST /api/files:", error);
    return serverError(error);
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id"));
  if (id && filesStore.has(id)) return ok(filesStore.get(id));
  const all = Array.from(filesStore.entries()).slice(-50).map(([id, f]) => ({ id, name: f.name, ext: f.ext, group: f.group, size: f.size, sizeHuman: f.sizeHuman }));
  return ok({ files: all, total: filesStore.size });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id"));
  if (!id || !filesStore.has(id)) return badRequest("File not found");
  filesStore.delete(id);
  return ok({ deleted: true });
}
