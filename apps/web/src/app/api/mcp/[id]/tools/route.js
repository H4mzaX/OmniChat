import sql from "@/app/api/utils/sql";
import { ok, notFound, serverError } from "@/app/api/utils/response";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const [connector] = await sql`
      SELECT * FROM mcp_connectors WHERE id = ${id} LIMIT 1
    `;
    if (!connector) return notFound("MCP connector not found");

    const tools = await sql`
      SELECT * FROM mcp_tools WHERE connector_id = ${id} ORDER BY name ASC
    `;

    return ok({ connector: { id: connector.id, name: connector.name, slug: connector.slug }, tools });
  } catch (error) {
    console.error("GET /api/mcp/[id]/tools:", error);
    return serverError(error);
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const [connector] = await sql`
      SELECT * FROM mcp_connectors WHERE id = ${id} LIMIT 1
    `;
    if (!connector) return notFound("MCP connector not found");

    const body = await request.json();
    const { name, description, input_schema } = body;

    if (!name) {
      return Response.json({ error: "name required" }, { status: 400 });
    }

    const [tool] = await sql`
      INSERT INTO mcp_tools (connector_id, name, description, input_schema)
      VALUES (${id}, ${name}, ${description || ""}, ${input_schema ? JSON.stringify(input_schema) : "{}"})
      RETURNING *
    `;

    return Response.json({ tool }, { status: 201 });
  } catch (error) {
    console.error("POST /api/mcp/[id]/tools:", error);
    return serverError(error);
  }
}
