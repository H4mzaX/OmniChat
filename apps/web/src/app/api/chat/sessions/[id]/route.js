import sql from "../../../utils/sql.js";

export async function GET(request, { params: { id } }) {
  try {
    const sessions = await sql`
      SELECT cs.*, p.name as provider_name, p.slug as provider_slug
      FROM chat_sessions cs
      LEFT JOIN providers p ON cs.provider_id = p.id
      WHERE cs.id = ${id}
    `;
    if (!sessions.length)
      return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ session: sessions[0] });
  } catch (error) {
    console.error("GET /api/chat/sessions/[id] error:", error);
    return Response.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

export async function PATCH(request, { params: { id } }) {
  try {
    const body = await request.json();
    const { title, is_pinned, model_id, provider_id } = body;

    const setClauses = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) {
      setClauses.push(`title = $${idx++}`);
      values.push(title);
    }
    if (is_pinned !== undefined) {
      setClauses.push(`is_pinned = $${idx++}`);
      values.push(is_pinned);
    }
    if (model_id !== undefined) {
      setClauses.push(`model_id = $${idx++}`);
      values.push(model_id);
    }
    if (provider_id !== undefined) {
      setClauses.push(`provider_id = $${idx++}`);
      values.push(provider_id);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await sql(
      `UPDATE chat_sessions SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING *`,
      values,
    );

    return Response.json({ session: result[0] });
  } catch (error) {
    console.error("PATCH /api/chat/sessions/[id] error:", error);
    return Response.json(
      { error: "Failed to update session" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params: { id } }) {
  try {
    await sql`DELETE FROM chat_sessions WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/chat/sessions/[id] error:", error);
    return Response.json(
      { error: "Failed to delete session" },
      { status: 500 },
    );
  }
}
