import { analyzeSpreadsheet, detectAnomalies, ingest, validateFile } from "../utils/ingestion/index.js";
import { ok, badRequest, serverError } from "../utils/response";
import { rateLimit } from "../utils/rateLimit";

export async function POST(request) {
  const rl = rateLimit({ max: 10, windowMs: 60000 });
  const limit = rl(request);
  if (limit) return limit;

  try {
    const body = await request.json();
    const { action, buffer: b64, url, name } = body;

    if (!b64 && !url) return badRequest("buffer or url required");

    let buffer;
    if (b64) buffer = Buffer.from(b64, "base64");
    else {
      const resp = await fetch(url);
      buffer = Buffer.from(await resp.arrayBuffer());
    }

    const fname = name || "spreadsheet.xlsx";
    const ext = fname.split(".").pop().toLowerCase();

    if (action === "analyze" || action === "parse") {
      const result = analyzeSpreadsheet(buffer, ext);
      const anomalies = detectAnomalies(result);
      return ok({ ...result, anomalies });
    }

    if (action === "anomalies") {
      const result = analyzeSpreadsheet(buffer, ext);
      const anomalies = detectAnomalies(result);
      return ok({ anomalies, totalRows: result.totalRows || result.rows });
    }

    return badRequest("Unknown action. Use: analyze, parse, anomalies");
  } catch (error) {
    console.error("POST /api/spreadsheets:", error);
    return serverError(error);
  }
}
