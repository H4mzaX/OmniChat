import sql from "@/app/api/utils/sql";

export async function GET() {
  try {
    const connectors =
      await sql`SELECT * FROM mcp_connectors ORDER BY name ASC`;
    return Response.json({ connectors });
  } catch (err) {
    console.error("GET /api/mcp:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      description,
      server_url,
      auth_type,
      auth_token,
      icon,
      connector_type,
    } = body;
    if (!name || !server_url)
      return Response.json(
        { error: "name and server_url required" },
        { status: 400 },
      );
    const s =
      slug ||
      name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "") + "-custom";
    const [row] = await sql`
      INSERT INTO mcp_connectors (name, slug, description, server_url, auth_type, auth_token, icon, connector_type, is_enabled, is_connected)
      VALUES (${name}, ${s}, ${description || ""}, ${server_url}, ${auth_type || "none"}, ${auth_token || null}, ${icon || "⚡"}, ${connector_type || "remote"}, true, false)
      RETURNING *`;
    return Response.json({ connector: row });
  } catch (err) {
    console.error("POST /api/mcp:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
