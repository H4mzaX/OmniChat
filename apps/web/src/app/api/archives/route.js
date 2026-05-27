import { listArchive } from "../utils/ingestion/index.js";
import { validateFile, validateArchive } from "../utils/ingestion/safety.js";
import { ok, badRequest, serverError } from "../utils/response";
import { rateLimit } from "../utils/rateLimit";

export async function POST(request) {
  const rl = rateLimit({ max: 10, windowMs: 60000 });
  const limit = rl(request);
  if (limit) return limit;

  try {
    const ct = request.headers.get("content-type") || "";
    let buffer, name;

    if (ct.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!file) return badRequest("No file provided");
      buffer = Buffer.from(await file.arrayBuffer());
      name = file.name;
    } else {
      const body = await request.json();
      const { url, base64 } = body;
      if (base64) buffer = Buffer.from(base64, "base64");
      else if (url) {
        const resp = await fetch(url);
        buffer = Buffer.from(await resp.arrayBuffer());
      } else return badRequest("Provide file, base64, or url");
      name = body.name || "archive.zip";
    }

    const safe = validateArchive(name, buffer);
    if (!safe.valid) return badRequest(safe.error);

    const result = await listArchive(buffer, name);

    const action = request.url.includes("extract") ? "extract" :
      request.url.includes("tree") ? "tree" : "index";

    if (action === "tree" && result.files) {
      result.tree = buildTree(result.files);
    }

    return ok(result);
  } catch (error) {
    console.error("POST /api/archives:", error);
    return serverError(error);
  }
}

function buildTree(files) {
  const root = { name: "(root)", children: [], size: 0 };
  for (const f of files) {
    const parts = f.path.split("/");
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const existing = node.children.find((c) => c.name === parts[i]);
      if (existing) {
        node = existing;
      } else {
        const isFile = i === parts.length - 1;
        const child = { name: parts[i], children: isFile ? undefined : [], size: isFile ? f.size : 0, type: f.type };
        node.children.push(child);
        node = child;
      }
    }
    node.size = f.size;
  }
  return root;
}
