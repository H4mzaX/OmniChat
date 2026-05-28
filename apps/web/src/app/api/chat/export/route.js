import sql from "../../utils/sql.js";
import { ok, badRequest, notFound, serverError } from "../../utils/response.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const format = searchParams.get("format") || "json";

    if (!id) return badRequest("id query param required");

    const [session] = await sql`SELECT * FROM chat_sessions WHERE id = ${id} LIMIT 1`;
    if (!session) return notFound("Session not found");

    const messages = await sql`
      SELECT role, content, model_id, input_tokens, output_tokens, estimated_cost, created_at
      FROM messages WHERE session_id = ${id}
      ORDER BY created_at ASC
    `;

    if (format === "markdown") {
      const lines = [`# ${session.title}`, `*Exported ${new Date().toISOString()}*\n`];
      for (const msg of messages) {
        const role = msg.role === "user" ? "**You**" : "**Claude**";
        lines.push(`\n---\n\n${role}:\n\n${msg.content}\n`);
      }
      return new Response(lines.join("\n"), {
        headers: { "Content-Type": "text/markdown", "Content-Disposition": `attachment; filename="${session.title || "chat"}.md"` },
      });
    }

    const exportData = {
      version: "1.0",
      exported_at: new Date().toISOString(),
      session: {
        id: session.id,
        title: session.title,
        model_id: session.model_id,
        message_count: session.message_count,
        total_tokens: session.total_tokens,
        estimated_cost: session.estimated_cost,
        created_at: session.created_at,
      },
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        model_id: m.model_id,
        tokens: { input: m.input_tokens, output: m.output_tokens },
        cost: m.estimated_cost,
        created_at: m.created_at,
      })),
    };

    return Response.json(exportData, {
      headers: { "Content-Disposition": `attachment; filename="${session.title || "chat"}.json"` },
    });
  } catch (error) {
    console.error("GET /api/chat/export:", error);
    return serverError(error);
  }
}
