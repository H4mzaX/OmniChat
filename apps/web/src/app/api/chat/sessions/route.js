import sql from "../../utils/sql.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    let sessions;
    if (search) {
      sessions = await sql(
        `SELECT cs.*, p.name as provider_name, p.slug as provider_slug
         FROM chat_sessions cs
         LEFT JOIN providers p ON cs.provider_id = p.id
         WHERE cs.title ILIKE $1
         ORDER BY cs.is_pinned DESC, cs.updated_at DESC
         LIMIT 100`,
        [`%${search}%`],
      );
    } else {
      sessions = await sql`
        SELECT cs.*, p.name as provider_name, p.slug as provider_slug
        FROM chat_sessions cs
        LEFT JOIN providers p ON cs.provider_id = p.id
        ORDER BY cs.is_pinned DESC, cs.updated_at DESC
        LIMIT 100
      `;
    }

    return Response.json({ sessions });
  } catch (error) {
    console.error("GET /api/chat/sessions error:", error);
    return Response.json(
      { error: "Failed to fetch sessions" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, model_id, provider_id } = body;

    const result = await sql`
      INSERT INTO chat_sessions (title, model_id, provider_id)
      VALUES (${title || "New Chat"}, ${model_id || null}, ${provider_id || null})
      RETURNING *
    `;

    return Response.json({ session: result[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/chat/sessions error:", error);
    return Response.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }
}
