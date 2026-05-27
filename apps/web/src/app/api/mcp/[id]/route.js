import sql from "@/app/api/utils/sql";

export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    const { is_enabled, auth_token, server_url, name } = body;
    const id = params.id;
    const sets = [];
    const vals = [];
    let i = 1;
    if (is_enabled !== undefined) {
      sets.push(`is_enabled = $${i++}`);
      vals.push(is_enabled);
    }
    if (auth_token !== undefined) {
      sets.push(`auth_token = $${i++}`);
      vals.push(auth_token);
    }
    if (server_url !== undefined) {
      sets.push(`server_url = $${i++}`);
      vals.push(server_url);
    }
    if (name !== undefined) {
      sets.push(`name = $${i++}`);
      vals.push(name);
    }
    sets.push(`updated_at = NOW()`);
    vals.push(id);
    if (sets.length === 1)
      return Response.json({ error: "Nothing to update" }, { status: 400 });
    const q = `UPDATE mcp_connectors SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`;
    const [row] = await sql(q, vals);
    return Response.json({ connector: row });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await sql`DELETE FROM mcp_connectors WHERE id = ${params.id}`;
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

/* ── Test / ping connector ── */
export async function POST(request, { params }) {
  try {
    const [conn] =
      await sql`SELECT * FROM mcp_connectors WHERE id = ${params.id}`;
    if (!conn) return Response.json({ error: "Not found" }, { status: 404 });

    if (!conn.server_url) {
      await sql`UPDATE mcp_connectors SET is_connected = false, last_checked_at = NOW() WHERE id = ${params.id}`;
      return Response.json({ ok: false, error: "No server URL configured" });
    }

    const t0 = Date.now();
    try {
      const headers = { "Content-Type": "application/json" };
      if (conn.auth_token)
        headers["Authorization"] = `Bearer ${conn.auth_token}`;
      const res = await fetch(conn.server_url, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(8000),
      });
      const ok = res.ok || res.status === 405; // 405 = endpoint exists but method not allowed
      await sql`UPDATE mcp_connectors SET is_connected = ${ok}, is_enabled = ${ok}, last_checked_at = NOW() WHERE id = ${params.id}`;
      return Response.json({
        ok,
        latency_ms: Date.now() - t0,
        status: res.status,
      });
    } catch (e) {
      await sql`UPDATE mcp_connectors SET is_connected = false, last_checked_at = NOW() WHERE id = ${params.id}`;
      return Response.json({
        ok: false,
        error: e.message,
        latency_ms: Date.now() - t0,
      });
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
