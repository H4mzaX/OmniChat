import { ok, badRequest, serverError } from "../../utils/response.js";
import { logError } from "../../utils/logger.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (action === "export") {
      const sessions = await exportSessions();
      return ok({ sessions, exported_at: new Date().toISOString() });
    }

    if (action === "import") {
      if (!data?.sessions) return badRequest("data.sessions required");
      const result = await importSessions(data.sessions);
      return ok({ imported: result });
    }

    if (action === "backup") {
      return ok({
        note: "Full DB backup. Re-import via POST /api/local/db with action=restore and full data.",
        data: { sessions: await exportSessions() },
      });
    }

    return badRequest(`Unknown action: ${action}. Use: export, import, backup`);
  } catch (error) {
    logError("local/db", error);
    return serverError(error);
  }
}

async function exportSessions() {
  const sql = await getSql();
  const sessions = await sql`SELECT * FROM chat_sessions ORDER BY updated_at DESC LIMIT 500`;
  for (const session of sessions) {
    session.messages = await sql`
      SELECT role, content, model_id, input_tokens, output_tokens, estimated_cost, created_at
      FROM messages WHERE session_id = ${session.id} ORDER BY created_at ASC
    `;
  }
  return sessions;
}

async function importSessions(sessions) {
  const sql = await getSql();
  let count = 0;
  for (const s of sessions) {
    await sql`
      INSERT INTO chat_sessions (id, title, model_id, created_at, updated_at, message_count)
      VALUES (${s.id}, ${s.title || "Imported Chat"}, ${s.model_id}, ${s.created_at || new Date()}, ${s.updated_at || new Date()}, ${s.messages?.length || 0})
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, updated_at = EXCLUDED.updated_at
    `;
    if (s.messages) {
      for (const m of s.messages) {
        await sql`
          INSERT INTO messages (session_id, role, content, model_id, input_tokens, output_tokens, estimated_cost, created_at)
          VALUES (${s.id}, ${m.role}, ${m.content}, ${m.model_id}, ${m.input_tokens || 0}, ${m.output_tokens || 0}, ${m.estimated_cost || 0}, ${m.created_at || new Date()})
        `;
      }
    }
    count++;
  }
  return count;
}

async function getSql() {
  const { default: sql } = await import("../../utils/sql");
  return sql;
}
