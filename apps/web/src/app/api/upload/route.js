import { ok, badRequest, serverError } from "../utils/response";
import { rateLimit } from "../utils/rateLimit";
import { logError } from "../utils/logger";

const ALLOWED_TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/json": "json",
  "application/xml": "xml",
  "text/markdown": "md",
};

const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request) {
  const rl = rateLimit({ max: 30, windowMs: 60000 });
  const limit = rl(request);
  if (limit) return limit;

  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!file) return badRequest("No file provided");

      if (file.size > MAX_SIZE) {
        return badRequest("File too large. Max 10MB");
      }

      const ext = ALLOWED_TYPES[file.type];
      if (!ext) {
        return badRequest(
          `Unsupported file type: ${file.type}. Allowed: ${Object.keys(ALLOWED_TYPES).join(", ")}`,
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");

      return ok({
        name: file.name,
        size: file.size,
        type: file.type,
        extension: ext,
        base64,
        dataUri: `data:${file.type};base64,${base64}`,
      });
    }

    const body = await request.json();
    const { url, base64, mime } = body;

    if (url) {
      const resp = await fetch(url);
      if (!resp.ok) return badRequest("Failed to fetch URL");
      const buffer = Buffer.from(await resp.arrayBuffer());
      const type = resp.headers.get("content-type") || mime || "application/octet-stream";
      return ok({
        url,
        size: buffer.length,
        type,
        base64: buffer.toString("base64"),
        dataUri: `data:${type};base64,${buffer.toString("base64")}`,
      });
    }

    if (base64) {
      const buffer = Buffer.from(base64, "base64");
      return ok({
        size: buffer.length,
        type: mime || "application/octet-stream",
        base64,
        dataUri: `data:${mime || "application/octet-stream"};base64,${base64}`,
      });
    }

    return badRequest("Provide file, url, or base64");
  } catch (error) {
    logError("upload", error);
    return serverError(error);
  }
}

export async function GET() {
  return ok({
    allowedTypes: Object.entries(ALLOWED_TYPES).map(([mime, ext]) => ({ mime, ext })),
    maxSize: MAX_SIZE,
    maxSizeHuman: "10MB",
  });
}
