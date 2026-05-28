import sql from "../utils/sql.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerSlug = searchParams.get("provider");
    const connectedOnly = searchParams.get("connected") === "true";

    let models;
    if (providerSlug) {
      models = await sql`
        SELECT m.*, p.name as provider_name, p.slug as provider_slug, p.is_connected
        FROM models m
        JOIN providers p ON m.provider_id = p.id
        WHERE p.slug = ${providerSlug} AND m.is_enabled = true
        ORDER BY m.display_name ASC
      `;
    } else if (connectedOnly) {
      models = await sql`
        SELECT m.*, p.name as provider_name, p.slug as provider_slug, p.is_connected
        FROM models m
        JOIN providers p ON m.provider_id = p.id
        WHERE p.is_connected = true AND m.is_enabled = true
        ORDER BY p.name ASC, m.display_name ASC
      `;
    } else {
      models = await sql`
        SELECT m.*, p.name as provider_name, p.slug as provider_slug, p.is_connected
        FROM models m
        JOIN providers p ON m.provider_id = p.id
        WHERE m.is_enabled = true
        ORDER BY p.name ASC, m.display_name ASC
      `;
    }

    return Response.json({ models });
  } catch (error) {
    console.error("GET /api/models error:", error);
    return Response.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}
