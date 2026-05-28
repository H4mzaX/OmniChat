import { cloneRepo, indexRepo, analyzeRepo, findSymbols } from "../utils/ingestion/index.js";
import { ok, badRequest, serverError } from "../utils/response.js";
import { rateLimit } from "../utils/rateLimit.js";
import fs from "fs";

const repos = new Map();

export async function POST(request) {
  const rl = rateLimit({ max: 5, windowMs: 60000 });
  const limit = rl(request);
  if (limit) return limit;

  try {
    const body = await request.json();
    const { action, url, ref, repoPath, query } = body;

    if (action === "import") {
      if (!url) return badRequest("url required (GitHub/GitLab clone URL)");
      const result = await cloneRepo(url, ref || "main");
      const path = result.path;
      const id = `repo-${Date.now()}`;
      repos.set(id, { url, path, imported: new Date().toISOString() });
      return ok({ id, path, ...result });
    }

    if (action === "index") {
      if (!repoPath) return badRequest("repoPath required");
      const result = await indexRepo(repoPath);
      return ok(result);
    }

    if (action === "analyze") {
      if (!repoPath) return badRequest("repoPath required");
      if (!fs.existsSync(repoPath)) return badRequest("Repo path does not exist");
      const index = await indexRepo(repoPath);
      const analysis = await analyzeRepo(repoPath);
      return ok({ ...index, git: analysis });
    }

    if (action === "symbols") {
      if (!repoPath || !query) return badRequest("repoPath and query required");
      const result = await findSymbols(repoPath, query);
      return ok(result);
    }

    if (action === "tree") {
      if (!repoPath) return badRequest("repoPath required");
      const result = await indexRepo(repoPath);
      return ok({ files: result.files, directories: result.directories, languages: result.languages, totalFiles: result.totalFiles });
    }

    return badRequest("Unknown action. Use: import, index, analyze, symbols, tree");
  } catch (error) {
    console.error("POST /api/repos:", error);
    return serverError(error);
  }
}

export async function GET() {
  const all = Array.from(repos.entries()).map(([id, r]) => ({ id, url: r.url, imported: r.imported }));
  return ok({ repos: all });
}
