const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_ARCHIVE_SIZE = 200 * 1024 * 1024;
const MAX_RECURSIVE_DEPTH = 5;
const MAX_EXTRACTED_FILES = 500;
const PROCESSING_TIMEOUT = 30000;

const ALLOWED_MIME_TYPES = {
  // Documents
  "application/pdf": { ext: "pdf", group: "document" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { ext: "docx", group: "document" },
  "application/msword": { ext: "doc", group: "document" },
  "text/plain": { ext: "txt", group: "document" },
  "text/markdown": { ext: "md", group: "document" },
  "application/rtf": { ext: "rtf", group: "document" },
  "text/csv": { ext: "csv", group: "spreadsheet" },
  "text/tab-separated-values": { ext: "tsv", group: "spreadsheet" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { ext: "xlsx", group: "spreadsheet" },
  "application/vnd.ms-excel": { ext: "xls", group: "spreadsheet" },
  "application/json": { ext: "json", group: "document" },
  "application/xml": { ext: "xml", group: "document" },
  "text/xml": { ext: "xml", group: "document" },
  "text/yaml": { ext: "yaml", group: "document" },
  "application/x-yaml": { ext: "yaml", group: "document" },
  "application/toml": { ext: "toml", group: "document" },
  "text/x-log": { ext: "log", group: "document" },
  "application/sql": { ext: "sql", group: "document" },
  // Images
  "image/png": { ext: "png", group: "image" },
  "image/jpeg": { ext: "jpg", group: "image" },
  "image/webp": { ext: "webp", group: "image" },
  "image/gif": { ext: "gif", group: "image" },
  "image/svg+xml": { ext: "svg", group: "image" },
  "image/bmp": { ext: "bmp", group: "image" },
  "image/tiff": { ext: "tiff", group: "image" },
  "image/heic": { ext: "heic", group: "image" },
  "image/x-icon": { ext: "ico", group: "image" },
  "image/vnd.microsoft.icon": { ext: "ico", group: "image" },
  // Archives
  "application/zip": { ext: "zip", group: "archive" },
  "application/x-tar": { ext: "tar", group: "archive" },
  "application/gzip": { ext: "tar.gz", group: "archive" },
  "application/x-7z-compressed": { ext: "7z", group: "archive" },
  "application/x-rar-compressed": { ext: "rar", group: "archive" },
  // Code
  "text/javascript": { ext: "js", group: "code" },
  "text/typescript": { ext: "ts", group: "code" },
  "text/x-python": { ext: "py", group: "code" },
  "text/x-rust": { ext: "rs", group: "code" },
  "text/x-go": { ext: "go", group: "code" },
  "text/x-java": { ext: "java", group: "code" },
  "text/x-c": { ext: "c", group: "code" },
  "text/x-c++": { ext: "cpp", group: "code" },
  "text/x-csharp": { ext: "cs", group: "code" },
  "text/x-ruby": { ext: "rb", group: "code" },
  "text/x-php": { ext: "php", group: "code" },
  "text/x-shellscript": { ext: "sh", group: "code" },
  "text/html": { ext: "html", group: "code" },
  "text/css": { ext: "css", group: "code" },
  "text/x-scss": { ext: "scss", group: "code" },
  "text/x-dockerignore": { ext: "dockerfile", group: "code" },
  "text/x-terraform": { ext: "tf", group: "code" },
  // Audio
  "audio/mpeg": { ext: "mp3", group: "audio" },
  "audio/wav": { ext: "wav", group: "audio" },
  "audio/aac": { ext: "aac", group: "audio" },
  "audio/mp4": { ext: "m4a", group: "audio" },
  "audio/ogg": { ext: "ogg", group: "audio" },
  "audio/flac": { ext: "flac", group: "audio" },
  // Video
  "video/mp4": { ext: "mp4", group: "video" },
  "video/quicktime": { ext: "mov", group: "video" },
  "video/x-msvideo": { ext: "avi", group: "video" },
  "video/x-matroska": { ext: "mkv", group: "video" },
  "video/webm": { ext: "webm", group: "video" },
  "video/x-m4v": { ext: "m4v", group: "video" },
  // Presentations
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { ext: "pptx", group: "presentation" },
  "application/vnd.ms-powerpoint": { ext: "ppt", group: "presentation" },
};

function detectMime(name, buffer) {
  const sigs = [
    { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
    { mime: "application/zip", bytes: [0x50, 0x4b, 0x03, 0x04] },
    { mime: "application/x-rar-compressed", bytes: [0x52, 0x61, 0x72, 0x21] },
    { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
    { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
    { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
    { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
    { mime: "image/tiff", bytes: [0x49, 0x49, 0x2a, 0x00] },
    { mime: "image/bmp", bytes: [0x42, 0x4d] },
    { mime: "audio/mpeg", bytes: [0xff, 0xfb] },
    { mime: "audio/flac", bytes: [0x66, 0x4c, 0x61, 0x43] },
    { mime: "video/mp4", bytes: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70] },
    { mime: "video/webm", bytes: [0x1a, 0x45, 0xdf, 0xa3] },
  ];
  const firstBytes = new Uint8Array(buffer.slice(0, 16));
  for (const sig of sigs) {
    if (sig.bytes.every((b, i) => firstBytes[i] === b)) return sig.mime;
  }
  const ext = name.split(".").pop().toLowerCase();
  for (const [mime, info] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (info.ext === ext) return mime;
  }
  return null;
}

export function validateFile(name, buffer) {
  const size = buffer.length;
  if (size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large: ${(size / 1024 / 1024).toFixed(1)}MB (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` };
  }
  const mime = detectMime(name, buffer);
  if (!mime) {
    return { valid: false, error: `Unrecognized or unsupported file type: ${name}` };
  }
  const info = ALLOWED_MIME_TYPES[mime];
  return { valid: true, mime, ext: info.ext, group: info.group, size };
}

export function validateArchive(name, buffer) {
  const size = buffer.length;
  if (size > MAX_ARCHIVE_SIZE) {
    return { valid: false, error: `Archive too large: ${(size / 1024 / 1024).toFixed(1)}MB (max ${MAX_ARCHIVE_SIZE / 1024 / 1024}MB)` };
  }
  return { valid: true, size };
}

export const limits = { MAX_FILE_SIZE, MAX_ARCHIVE_SIZE, MAX_RECURSIVE_DEPTH, MAX_EXTRACTED_FILES, PROCESSING_TIMEOUT };
export { detectMime, ALLOWED_MIME_TYPES };
