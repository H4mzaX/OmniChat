import * as parsers from "./parsers.js";
import { ocrImage, ocrTable } from "./ocr.js";
import { analyzeImage, getImageBase64, preprocessForOcr } from "./images.js";
import { extractZip, extractTar, listArchive } from "./archives.js";
import { cloneRepo, indexRepo, analyzeRepo, findSymbols } from "./repos.js";
import { getMediaInfo, extractVideoFrames, transcribeAudio, analyzeVideo } from "./media.js";
import { analyzeSpreadsheet, detectAnomalies } from "./spreadsheets.js";
import { validateFile, detectMime, ALLOWED_MIME_TYPES } from "./safety.js";

export async function ingest(buffer, name, options = {}) {
  const safety = validateFile(name, buffer);
  if (!safety.valid) return { error: safety.error, file: name };

  const { mime, group, ext } = safety;

  const result = {
    name,
    ext,
    mime,
    group,
    size: buffer.length,
    sizeHuman: formatSize(buffer.length),
    ingested: new Date().toISOString(),
  };

  switch (group) {
    case "document":
      Object.assign(result, await parseDocument(buffer, ext, mime, options));
      break;
    case "spreadsheet":
      Object.assign(result, await parseSpreadsheet(buffer, ext, mime, options));
      break;
    case "image":
      Object.assign(result, await processImage(buffer, mime, options));
      break;
    case "archive":
      Object.assign(result, await processArchive(buffer, name, options));
      break;
    case "code":
      result.text = Buffer.from(buffer).toString("utf-8");
      result.format = "code";
      result.lines = result.text.split("\n").length;
      break;
    case "audio":
      Object.assign(result, await processAudio(buffer, name, options));
      break;
    case "video":
      Object.assign(result, await processVideo(buffer, name, options));
      break;
    case "presentation":
      Object.assign(result, await processPresentation(buffer, ext, options));
      break;
    default:
      result.text = Buffer.from(buffer).toString("utf-8").slice(0, 100000);
      result.format = "raw";
  }

  return result;
}

async function parseDocument(buffer, ext, mime, options) {
  switch (ext) {
    case "pdf": {
      const pdf = await parsers.parsePdf(buffer);
      if (options.ocr && pdf.text.trim().length < 100) {
        const ocr = await ocrImage(buffer);
        pdf.text = ocr.text || pdf.text;
        pdf.ocrApplied = true;
      }
      return { text: pdf.text, pages: pdf.pages, metadata: pdf.metadata, format: "pdf" };
    }
    case "docx": {
      const docx = await parsers.parseDocx(buffer);
      return { text: docx.text, format: "docx", messages: docx.messages };
    }
    case "doc": {
      const doc = await parsers.parseDoc(buffer);
      return { text: doc.text, format: "doc" };
    }
    case "txt": {
      const txt = parsers.parseText(buffer);
      return { text: txt.text, format: "text" };
    }
    case "md":
    case "markdown": {
      const md = parsers.parseMarkdown(buffer);
      return { text: md.text, format: "markdown" };
    }
    case "rtf": {
      const rtf = parsers.parseRtf(buffer);
      return { text: rtf.text, format: "rtf" };
    }
    case "json": {
      const json = parsers.parseJson(buffer);
      return { text: json.text, parsed: json.parsed, validJson: json.valid, format: "json" };
    }
    case "xml":
      return { text: parsers.parseXml(buffer).text, format: "xml" };
    case "yaml":
      return { text: parsers.parseYaml(buffer).text, format: "yaml" };
    case "toml":
      return { text: parsers.parseToml(buffer).text, format: "toml" };
    case "ini":
      return { text: parsers.parseIni(buffer).text, format: "ini" };
    case "log": {
      const log = parsers.parseLog(buffer);
      return { text: log.text, lines: log.lines, format: "log" };
    }
    case "sql": {
      const sql = parsers.parseSql(buffer);
      return { text: sql.text, statements: sql.statements, format: "sql" };
    }
    default:
      return { text: Buffer.from(buffer).toString("utf-8").slice(0, 100000), format: ext };
  }
}

async function parseSpreadsheet(buffer, ext, mime, options) {
  if (ext === "csv") {
    const csv = parsers.parseCsv(buffer);
    return { text: csv.text, rows: csv.rows, fields: csv.fields, total: csv.total, format: "csv" };
  }
  if (ext === "tsv") {
    const tsv = parsers.parseTsv(buffer);
    return { text: tsv.text, rows: tsv.rows, fields: tsv.fields, total: tsv.total, format: "tsv" };
  }
  const xlsx = parsers.parseXlsx(buffer);
  const analysis = analyzeSpreadsheet(buffer, ext);
  return {
    text: xlsx.text,
    sheets: xlsx.sheets,
    sheetNames: xlsx.sheetNames,
    sheetCount: xlsx.sheetCount,
    analysis,
    anomalies: detectAnomalies(analysis),
    format: ext,
  };
}

async function processImage(buffer, mime, options) {
  const analysis = await analyzeImage(buffer, mime);
  const base64 = await getImageBase64(buffer, mime);
  const result = { ...analysis, base64, format: "image" };

  if (options.ocr) {
    const preprocessed = await preprocessForOcr(buffer);
    const ocr = await ocrImage(preprocessed);
    result.ocr = ocr;
  }

  return result;
}

async function processArchive(buffer, name, options) {
  const extracted = await listArchive(buffer, name);
  return { ...extracted, format: "archive" };
}

async function processAudio(buffer, name, options) {
  const info = await getMediaInfo(buffer, name);
  const transcript = options.transcribe ? await transcribeAudio(buffer) : null;
  return { info, transcript, format: "audio" };
}

async function processVideo(buffer, name, options) {
  const analysis = options.extractFrames !== false ? await analyzeVideo(buffer) : { info: await getMediaInfo(buffer, name) };
  const transcript = options.transcribe ? await transcribeAudio(buffer) : null;
  return { ...analysis, transcript, format: "video" };
}

async function processPresentation(buffer, ext, options) {
  try {
    const OfficeParser = (await import("officeparser")).default;
    const text = await OfficeParser.parseOfficeAsync(buffer);
    return { text, slides: countSlides(text), format: ext === "pptx" ? "pptx" : "ppt" };
  } catch {
    const text = Buffer.from(buffer).toString("utf-8").slice(0, 50000);
    return { text, format: ext, warning: "Full presentation parsing requires native libraries" };
  }
}

function countSlides(text) {
  const indicators = text.match(/(?:slide|page)\s*\d+/gi);
  return indicators ? Math.max(...indicators.map((s) => parseInt(s.replace(/\D/g, "")) || 1)) : 1;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export { cloneRepo, indexRepo, analyzeRepo, findSymbols };
export { extractZip, extractTar, listArchive };
export { analyzeImage, getImageBase64, preprocessForOcr };
export { ocrImage, ocrTable };
export { analyzeSpreadsheet, detectAnomalies };
export { validateFile, detectMime, ALLOWED_MIME_TYPES };
