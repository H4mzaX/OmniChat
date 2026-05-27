import AdmZip from "adm-zip";
import * as tar from "tar";
import { validateFile, validateArchive, limits } from "./safety.js";

const BOMB_THRESHOLD = 500 * 1024 * 1024;
const MAX_FILES = limits.MAX_EXTRACTED_FILES;
const MAX_DEPTH = limits.MAX_RECURSIVE_DEPTH;

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
      files.push({
        path: entry.entryName,
        size: content.length,
        type: fileCheck.group || "unknown",
        mime: fileCheck.mime || "application/octet-stream",
        preview: content.length < 100000 ? content.toString("utf-8").slice(0, 5000) : null,
      });
    } catch {
      files.push({ path: entry.entryName, size: 0, type: "unknown", error: "Failed to extract" });
    }
  }

  return { files, total: files.length, format: "zip" };
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
