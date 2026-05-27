import mammoth from "mammoth";
import * as xlsx from "xlsx";
import papa from "papaparse";

let pdfParse;
async function getPdfParser() {
  if (!pdfParse) pdfParse = (await import("pdf-parse")).default;
  return pdfParse;
}

let officeParser;
async function getOfficeParser() {
  if (!officeParser) officeParser = (await import("officeparser")).default;
  return officeParser;
}

/* ─── PDF ──────────────────────────────────────────────────── */
export async function parsePdf(buffer) {
  const parse = await getPdfParser();
  const data = await parse(buffer);
  return {
    text: data.text,
    pages: data.numpages,
    metadata: data.metadata || {},
    info: data.info || {},
  };
}

/* ─── DOCX ─────────────────────────────────────────────────── */
export async function parseDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  const meta = await mammoth.extractRawText({ buffer });
  return {
    text: result.value,
    messages: result.messages,
    metadata: meta.value ? { extracted: true } : {},
  };
}

/* ─── DOC (legacy) ─────────────────────────────────────────── */
export async function parseDoc(buffer) {
  try {
    const parser = await getOfficeParser();
    const text = await parser.parseOfficeAsync(buffer);
    return { text: text || "", format: "legacy doc" };
  } catch {
    return { text: Buffer.from(buffer).toString("utf-8").replace(/[^\x20-\x7E\n\r]/g, " "), format: "raw" };
  }
}

/* ─── TXT / Markdown / RTF ─────────────────────────────────── */
export function parseText(buffer) {
  return { text: Buffer.from(buffer).toString("utf-8") };
}

export function parseMarkdown(buffer) {
  const text = Buffer.from(buffer).toString("utf-8");
  return { text, format: "markdown" };
}

export function parseRtf(buffer) {
  const text = Buffer.from(buffer).toString("utf-8");
  const stripped = text.replace(/\\[a-z]+[-0-9]*/gi, " ").replace(/[{}]/g, "").replace(/\s+/g, " ").trim();
  return { text: stripped, format: "rtf" };
}

/* ─── CSV / TSV ────────────────────────────────────────────── */
export function parseCsv(buffer) {
  const text = Buffer.from(buffer).toString("utf-8");
  const result = papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
  return {
    text: text,
    rows: result.data,
    fields: result.meta.fields || [],
    total: result.data.length,
    errors: result.errors,
  };
}

export function parseTsv(buffer) {
  const text = Buffer.from(buffer).toString("utf-8");
  const result = papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true, delimiter: "\t" });
  return {
    text: text,
    rows: result.data,
    fields: result.meta.fields || [],
    total: result.data.length,
  };
}

/* ─── XLSX / XLS ───────────────────────────────────────────── */
export function parseXlsx(buffer) {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheets = [];
  let fullText = "";

  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    const json = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    const csv = xlsx.utils.sheet_to_csv(sheet);
    const html = xlsx.utils.sheet_to_html(sheet);
    sheets.push({
      name,
      rows: json,
      colCount: json.reduce((m, r) => Math.max(m, r.length), 0),
      rowCount: json.length,
      preview: json.slice(0, 50),
      csv: csv.slice(0, 5000),
      html: html.slice(0, 5000),
    });
    fullText += `\n--- ${name} ---\n` + csv;
  }

  return {
    text: fullText.trim(),
    sheets,
    sheetCount: workbook.SheetNames.length,
    sheetNames: workbook.SheetNames,
    properties: workbook.Props || {},
  };
}

/* ─── JSON ─────────────────────────────────────────────────── */
export function parseJson(buffer) {
  const text = Buffer.from(buffer).toString("utf-8");
  try {
    const parsed = JSON.parse(text);
    return { text, parsed, valid: true, size: typeof parsed === "object" ? Object.keys(parsed).length : 1 };
  } catch (e) {
    return { text, parsed: null, valid: false, error: e.message };
  }
}

/* ─── XML ──────────────────────────────────────────────────── */
export function parseXml(buffer) {
  const text = Buffer.from(buffer).toString("utf-8");
  return { text, format: "xml" };
}

/* ─── YAML ─────────────────────────────────────────────────── */
export function parseYaml(buffer) {
  const text = Buffer.from(buffer).toString("utf-8");
  return { text, format: "yaml" };
}

/* ─── TOML ─────────────────────────────────────────────────── */
export function parseToml(buffer) {
  const text = Buffer.from(buffer).toString("utf-8");
  return { text, format: "toml" };
}

/* ─── INI ──────────────────────────────────────────────────── */
export function parseIni(buffer) {
  const text = Buffer.from(buffer).toString("utf-8");
  return { text, format: "ini" };
}

/* ─── LOG ──────────────────────────────────────────────────── */
export function parseLog(buffer) {
  const text = Buffer.from(buffer).toString("utf-8");
  const lines = text.split("\n").filter((l) => l.trim());
  return {
    text,
    lines: lines.length,
    hasTimestamps: lines.some((l) => /^\d{4}[-/]\d{2}[/-]\d{2}/.test(l)),
    format: "log",
  };
}

/* ─── SQL dump ─────────────────────────────────────────────── */
export function parseSql(buffer) {
  const text = Buffer.from(buffer).toString("utf-8");
  const statements = text.match(/^[^;]+;/gm) || [];
  return {
    text,
    statements: statements.length,
    format: "sql",
  };
}
