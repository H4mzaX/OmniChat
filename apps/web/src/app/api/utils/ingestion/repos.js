import fs from "fs";
import path from "path";
import os from "os";
import { glob } from "glob";

let simpleGit;
async function getGit() {
  if (!simpleGit) simpleGit = (await import("simple-git")).default;
  return simpleGit;
}

const CODE_EXTENSIONS = new Set([
  ".js", ".ts", ".jsx", ".tsx", ".py", ".rs", ".go", ".java", ".kt", ".swift",
  ".php", ".rb", ".c", ".cpp", ".h", ".hpp", ".cs", ".sql", ".sh", ".bash",
  ".zsh", ".fish", ".yaml", ".yml", ".toml", ".json", ".xml", ".html", ".css",
  ".scss", ".sass", ".less", ".md", ".txt", ".dockerfile", ".tf", ".tfvars",
  ".vue", ".svelte", ".astro", ".clj", ".cljs", ".ex", ".exs", ".erl", ".hs",
  ".lua", ".r", ".scala", ".zig",
]);

const IGNORE_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", ".nuxt", ".output",
  "target", "vendor", ".venv", "venv", "__pycache__", ".cache",
  "coverage", ".nyc_output", ".svelte-kit", ".expo",
]);

export async function cloneRepo(url, ref = "main") {
  const git = await getGit();
  const tmpDir = path.join(os.tmpdir(), "omniclaude-repos", `repo-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  await git().clone(url, tmpDir, ["--depth=1", "--branch", ref]);
  return { path: tmpDir };
}

export async function indexRepo(repoPath) {
  const files = await glob("**/*", {
    cwd: repoPath,
    nodir: true,
    dot: true,
    ignore: [...IGNORE_DIRS].map((d) => `**/${d}/**`),
  });

  const codeFiles = [];
  const allFiles = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const fullPath = path.join(repoPath, file);
    try {
      const stat = fs.statSync(fullPath);
      const isCode = CODE_EXTENSIONS.has(ext);
      const entry = {
        path: file,
        ext,
        size: stat.size,
        lines: isCode ? countLines(fullPath) : 0,
        isCode,
        lastModified: stat.mtimeMs,
      };
      allFiles.push(entry);
      if (isCode && stat.size < 500000) {
        entry.content = fs.readFileSync(fullPath, "utf-8").slice(0, 10000);
        codeFiles.push(entry);
      }
    } catch {}
  }

  const extensions = {};
  for (const f of allFiles) {
    if (f.ext) extensions[f.ext] = (extensions[f.ext] || 0) + 1;
  }

  return {
    files: allFiles,
    codeFiles,
    totalFiles: allFiles.length,
    codeFileCount: codeFiles.length,
    languages: extensions,
    directories: extractDirs(allFiles),
  };
}

export async function analyzeRepo(repoPath) {
  const git = await getGit();
  try {
    const log = await git().cwd(repoPath).log({ maxCount: 10 });
    const status = await git().cwd(repoPath).status();
    const branches = await git().cwd(repoPath).branch();
    const remotes = await git().cwd(repoPath).getRemotes(true);

    return {
      commits: log.all.map((c) => ({ hash: c.hash, message: c.message, author: c.author_name, date: c.date })),
      branch: status.current,
      branches: branches.all,
      remote: remotes.map((r) => ({ name: r.name, url: r.refs?.fetch })),
      isDirty: status.files.length > 0,
      modifiedCount: status.files.length,
      commitCount: log.total,
    };
  } catch (e) {
    return { error: `Git analysis failed: ${e.message}` };
  }
}

export async function findSymbols(repoPath, query) {
  const files = await glob(`**/*.{js,ts,jsx,tsx,py,rs,go,java}`, {
    cwd: repoPath,
    ignore: ["**/node_modules/**", "**/.git/**"],
  });

  const results = [];
  const pattern = new RegExp(query, "i");

  for (const file of files.slice(0, 200)) {
    try {
      const content = fs.readFileSync(path.join(repoPath, file), "utf-8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
          results.push({ file, line: i + 1, text: lines[i].trim().slice(0, 200) });
        }
      }
    } catch {}
  }

  return { query, results, total: results.length };
}

function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return content.split("\n").length;
  } catch {
    return 0;
  }
}

function extractDirs(files) {
  const dirs = new Set();
  for (const f of files) {
    const dir = path.dirname(f.path);
    if (dir !== ".") dirs.add(dir);
  }
  return [...dirs].sort();
}
