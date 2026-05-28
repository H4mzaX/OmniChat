import sql from "../utils/sql.js";

export async function GET() {
  try {
    const providers = await sql`
      SELECT p.*,
        ak.id as key_id,
        ak.key_preview,
        ak.is_valid,
        ak.last_validated_at,
        COUNT(m.id) as model_count
      FROM providers p
      LEFT JOIN api_keys ak ON ak.provider_id = p.id
      LEFT JOIN models m ON m.provider_id = p.id AND m.is_enabled = true
      GROUP BY p.id, ak.id, ak.key_preview, ak.is_valid, ak.last_validated_at
      ORDER BY p.provider_type ASC, p.name ASC
    `;
    return Response.json({ providers });
  } catch (error) {
    console.error("GET /api/providers error:", error);
    return Response.json(
      { error: "Failed to fetch providers" },
      { status: 500 },
    );
  }
}
