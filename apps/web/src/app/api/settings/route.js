import sql from "../utils/sql.js";

export async function GET() {
  try {
    const rows = await sql`SELECT key, value FROM settings ORDER BY key`;
    const settings = {};
    for (const row of rows) {
      // value is stored as JSONB — Neon returns it already parsed
      settings[row.key] = row.value;
    }
    return Response.json({ settings });
  } catch (err) {
    console.error("GET /api/settings:", err);
    return Response.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return Response.json(
        { error: "Body must be a JSON object" },
        { status: 400 },
      );
    }
    for (const [key, value] of Object.entries(body)) {
      // Store value as proper JSONB — do NOT double-stringify
      await sql`
        INSERT INTO settings (key, value, updated_at) VALUES (${key}, ${JSON.stringify(value)}::jsonb, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `;
    }
    return Response.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/settings:", err);
    return Response.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
