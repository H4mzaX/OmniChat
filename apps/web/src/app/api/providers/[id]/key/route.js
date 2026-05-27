import sql from "@/app/api/utils/sql";

export async function POST(request, { params }) {
  const id = params.id;
  try {
    const body = await request.json();
    const { api_key } = body;

    // Fetch provider to check type
    const [provider] =
      await sql`SELECT * FROM providers WHERE id = ${id} LIMIT 1`;
    if (!provider)
      return Response.json({ error: "Provider not found" }, { status: 404 });

    const isLocal = provider.provider_type === "local";

    // For local providers (Ollama, LM Studio) we store a placeholder key
    if (!isLocal && (!api_key || api_key.trim().length < 8)) {
      return Response.json(
        { error: "API key must be at least 8 characters" },
        { status: 400 },
      );
    }

    const keyValue = isLocal ? "local-no-key-required" : api_key.trim();
    const keyPreview = isLocal
      ? "local"
      : keyValue.slice(0, 6) + "•••" + keyValue.slice(-4);

    // Upsert key
    const [existing] =
      await sql`SELECT id FROM api_keys WHERE provider_id = ${id}`;
    if (existing) {
      await sql`
        UPDATE api_keys
        SET full_key = ${keyValue}, key_preview = ${keyPreview}, is_valid = NULL, last_validated_at = NULL
        WHERE provider_id = ${id}`;
    } else {
      await sql`
        INSERT INTO api_keys (provider_id, full_key, key_preview)
        VALUES (${id}, ${keyValue}, ${keyPreview})`;
    }

    // Mark provider connected
    await sql`
      UPDATE providers SET is_enabled = true, is_connected = true, updated_at = NOW()
      WHERE id = ${id}`;

    return Response.json({ success: true, key_preview: keyPreview });
  } catch (err) {
    console.error("POST /api/providers/[id]/key:", err);
    return Response.json({ error: "Failed to store API key" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const id = params.id;
  try {
    await sql`DELETE FROM api_keys WHERE provider_id = ${id}`;
    await sql`UPDATE providers SET is_enabled = false, is_connected = false, updated_at = NOW() WHERE id = ${id}`;
    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/providers/[id]/key:", err);
    return Response.json({ error: "Failed to remove key" }, { status: 500 });
  }
}
