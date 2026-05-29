import AdmZip from "adm-zip";
import * as tar from "tar";
import { validateFile, validateArchive, limits } from "./safety.js";

const BOMB_THRESHOLD = 500 * 1024 * 1024;
const MAX_FILES = limits.MAX_EXTRACTED_FILES;
const MAX_DEPTH = limits.MAX_RECURSIVE_DEPTH;

const TEXT_GROUPS = new Set(["code", "document", "spreadsheet"]);
const MAX_TEXT_PER_FILE = 60000;

// Heuristic: treat as text if the leading bytes have no NUL and few control chars.
function looksLikeText(buf) {
  const n = Math.min(buf.length, 4096);
  if (n === 0) return true;
  let weird = 0;
  for (let i = 0; i < n; i++) {
    const c = buf[i];
    if (c === 0) return false;
    if (c < 9 || (c > 13 && c < 32)) weird++;
  }
  return weird / n < 0.1;
}

function decodeText(buf) {
  return buf.subarray(0, MAX_TEXT_PER_FILE * 4).toString("utf-8").slice(0, MAX_TEXT_PER_FILE);
}

export async function extractZip(buffer, name) {
  const safe = validateArchive(name, buffer);
  if (!safe.valid) return { error: safe.error };

  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  if (entries.length > MAX_FILES) {
    return { error: `Archive contains ${entries.length} files (max ${MAX_FILES})` };
  }

  const bombCheck = entries.reduce((sum, e) => sum + (e.header?.compressedSize || 0), 0);
  if (bombCheck > BOMB_THRESHOLD) {
    return { error: "Potential zip bomb detected (compressed ratio too high)" };
  }

  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory) continue;
    if (entry.entryName.split("/").length > MAX_DEPTH + 1) continue;
    try {
      const content = entry.getData();
      const fileCheck = validateFile(entry.entryName, content);
      const group = fileCheck.group || "unknown";
      const isText = TEXT_GROUPS.has(group) || looksLikeText(content);
      const fullText = isText ? decodeText(content) : null;
      files.push({
        path: entry.entryName,
        size: content.length,
        type: group,
        mime: fileCheck.mime || "application/octet-stream",
        isText,
        text: fullText,
        preview: fullText ? fullText.slice(0, 5000) : null,
      });
    } catch {
      files.push({ path: entry.entryName, size: 0, type: "unknown", error: "Failed to extract" });
    }
  }

  return { files, total: files.length, format: "zip", text: buildArchiveText(name, files) };
}

// Synthesize a single text payload the model can read: a tree manifest followed
// by the full source of each text file. Binary entries are listed but not inlined.
function buildArchiveText(name, files) {
  const manifest = files
    .map((f) => `  ${f.path}${f.error ? " (extract failed)" : ` — ${f.size} B, ${f.type}`}`)
    .join("\n");

  const textFiles = files.filter((f) => f.text && f.text.trim());
  let budget = 240000; // overall cap so a huge repo can't blow up the prompt
  const bodies = [];
  for (const f of textFiles) {
    if (budget <= 0) {
      bodies.push(`\n... [${textFiles.length - bodies.length} more file(s) omitted to fit context] ...`);
      break;
    }
    const slice = f.text.slice(0, Math.min(f.text.length, budget));
    budget -= slice.length;
    bodies.push(`\n----- ${f.path} -----\n${slice}`);
  }

  const binaryCount = files.length - textFiles.length;
  const header =
    `Archive: ${name}\n` +
    `Contents (${files.length} file${files.length === 1 ? "" : "s"}` +
    `${binaryCount ? `, ${binaryCount} binary/non-text` : ""}):\n${manifest}`;

  return textFiles.length
    ? `${header}\n\n===== FILE CONTENTS =====${bodies.join("\n")}`
    : `${header}\n\n(No text-readable files found in this archive.)`;
}

export async function extractTar(buffer, name) {
  const safe = validateArchive(name, buffer);
  if (!safe.valid) return { error: safe.error };

  const files = [];
  const extractOpts = {
    cwd: "/tmp",
    strip: 0,
  };

  try {
    await tar.t({ file: buffer, onentry: (entry) => {
      if (entry.type !== "File") return;
      if (entry.path.split("/").length > MAX_DEPTH + 1) return;
      files.push({
        path: entry.path,
        size: entry.size || 0,
        type: "unknown",
      });
    }});
  } catch (e) {
    return { error: `Tar extraction failed: ${e.message}` };
  }

  if (files.length > MAX_FILES) {
    return { error: `Archive contains ${files.length} files (max ${MAX_FILES})` };
  }

  return { files, total: files.length, format: name.endsWith(".gz") ? "tar.gz" : "tar" };
}

export async function extract7z(buffer) {
  return { error: "7z extraction requires native binary (p7zip). Install: brew install p7zip / apt install p7zip-full" };
}

export async function extractRar(buffer) {
  return { error: "RAR extraction requires unrar. Install: brew install unrar / apt install unrar" };
}

export async function listArchive(buffer, name) {
  if (name.endsWith(".zip") || name.endsWith(".zipx")) return extractZip(buffer, name);
  if (name.endsWith(".tar") || name.endsWith(".tar.gz") || name.endsWith(".tgz")) return extractTar(buffer, name);
  if (name.endsWith(".7z")) return extract7z(buffer);
  if (name.endsWith(".rar")) return extractRar(buffer);
  return { error: `Unsupported archive format: ${name}` };
}
