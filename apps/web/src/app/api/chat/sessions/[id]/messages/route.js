import sql from "@/app/api/utils/sql";

export async function GET(request, { params: { id } }) {
  try {
    const messages = await sql`
      SELECT m.*, p.name as provider_name, p.slug as provider_slug
      FROM messages m
      LEFT JOIN providers p ON m.provider_id = p.id
      WHERE m.session_id = ${id}
      ORDER BY m.created_at ASC
    `;
    return Response.json({ messages });
  } catch (error) {
    console.error("GET messages error:", error);
    return Response.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}
