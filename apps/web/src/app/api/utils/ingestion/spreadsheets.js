import * as xlsx from "xlsx";
import papa from "papaparse";

export function analyzeSpreadsheet(buffer, format) {
  if (format === "csv" || format === "tsv") {
    const text = Buffer.from(buffer).toString("utf-8");
    const result = papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
    return {
      type: format,
      rows: result.data.length,
      fields: result.meta.fields || [],
      sample: result.data.slice(0, 10),
      summary: generateSummary(result.data, result.meta.fields),
      format,
    };
  }

  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheets = [];

  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    const json = xlsx.utils.sheet_to_json(sheet, { defval: "", header: 1 });
    const headers = json[0] || [];
    const data = json.slice(1);

    const colTypes = {};
    for (let ci = 0; ci < headers.length; ci++) {
      const vals = data.slice(0, 100).map((r) => r[ci]).filter((v) => v !== "");
      colTypes[headers[ci] || `Col${ci}`] = inferType(vals);
    }

    sheets.push({
      name,
      rows: data.length,
      cols: headers.length,
      headers,
      sample: json.slice(0, 20),
      colTypes,
      hasFormulas: detectFormulas(json),
      summary: generateSummary(data, headers),
    });
  }

  return {
    type: format,
    sheets,
    sheetCount: sheets.length,
    totalRows: sheets.reduce((s, sh) => s + sh.rows, 0),
    workbookProps: workbook.Props || {},
  };
}

export function detectAnomalies(sheetData) {
  const anomalies = [];
  for (const sheet of sheetData.sheets || [sheetData]) {
    const rows = sheet.sample || [];
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri];
      for (let ci = 0; ci < row.length; ci++) {
        const val = row[ci];
        if (typeof val === "number" && (isNaN(val) || !isFinite(val))) {
          anomalies.push({ row: ri, col: ci, value: val, type: "invalid_number" });
        }
      }
    }
  }
  return anomalies;
}

function generateSummary(data, headers) {
  if (!data || data.length === 0 || !headers) return {};
  const summary = {};
  for (let i = 0; i < Math.min(headers.length, 20); i++) {
    const col = headers[i];
    if (!col) continue;
    const vals = data.slice(0, 500).map((r) => r[i]).filter((v) => v !== undefined && v !== null && v !== "");
    if (vals.length === 0) continue;
    const nums = vals.filter((v) => typeof v === "number");
    summary[col] = {
      type: inferType(vals),
      count: vals.length,
      unique: new Set(vals.map(String)).size,
      ...(nums.length > 0 ? { min: Math.min(...nums), max: Math.max(...nums), avg: nums.reduce((a, b) => a + b, 0) / nums.length } : {}),
      sample: vals.slice(0, 3),
    };
  }
  return summary;
}

function inferType(vals) {
  if (vals.length === 0) return "unknown";
  const types = new Set(vals.map((v) => typeof v));
  if (types.has("number") && types.size === 1) return "numeric";
  if (vals.every((v) => !isNaN(Date.parse(v)))) return "date";
  if (vals.every((v) => v === true || v === false || v === "true" || v === "false")) return "boolean";
  return "text";
}

function detectFormulas(rows) {
  for (const row of rows) {
    for (const cell of row) {
      if (typeof cell === "string" && cell.startsWith("=") && cell.length > 1) return true;
    }
  }
  return false;
}
