import sql from "@/app/api/utils/sql";
import { ok, badRequest, notFound, serverError } from "@/app/api/utils/response";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tool, args } = body;

    if (!tool) return badRequest("tool name required");

    const [connector] = await sql`
      SELECT * FROM mcp_connectors WHERE id = ${id} LIMIT 1
    `;
    if (!connector) return notFound("MCP connector not found");
    if (!connector.is_enabled) return badRequest("Connector is disabled");

    const callUrl = connector.server_url.endsWith("/call")
      ? connector.server_url
      : `${connector.server_url.replace(/\/$/, "")}/call`;

    let response;
    try {
      const headers = { "Content-Type": "application/json" };
      if (connector.auth_type === "bearer" && connector.auth_token) {
        headers["Authorization"] = `Bearer ${connector.auth_token}`;
      } else if (connector.auth_type === "header" && connector.auth_token) {
        headers[connector.auth_header_name || "X-API-Key"] = connector.auth_token;
      }

      response = await fetch(callUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ tool, args: args || {} }),
        signal: AbortSignal.timeout(30000),
      });
    } catch (fetchErr) {
      return serverError(new Error(`MCP call failed: ${fetchErr.message}`));
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "unknown");
      return serverError(new Error(`MCP returned ${response.status}: ${errText}`));
    }

    const result = await response.json();

    // Log the call
    await sql`
      INSERT INTO mcp_logs (connector_id, tool, args, result_summary, success)
      VALUES (${id}, ${tool}, ${JSON.stringify(args)}, ${JSON.stringify(result).slice(0, 500)}, true)
    `;

    return ok(result);
  } catch (error) {
    console.error("POST /api/mcp/[id]/call:", error);
    return serverError(error);
  }
}
