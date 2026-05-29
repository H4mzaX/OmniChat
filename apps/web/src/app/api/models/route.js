import sql from "../utils/sql.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerSlug = searchParams.get("provider");
    const connectedOnly = searchParams.get("connected") === "true";

    // Ensure the single "Free Models" entry exists and disable individual free models
    try {
      let builtinProvider;
      const providers = await sql`SELECT id FROM providers WHERE slug = 'builtin' LIMIT 1`;
      if (providers.length > 0) {
        builtinProvider = providers[0];
        // Ensure it's marked as connected
        await sql`UPDATE providers SET is_connected = true WHERE id = ${builtinProvider.id}`;
      } else {
        const [newProvider] = await sql`
          INSERT INTO providers (name, slug, provider_type, is_connected)
          VALUES ('Built-in', 'builtin', 'builtin', true)
          RETURNING id
        `;
        builtinProvider = newProvider;
      }

      if (builtinProvider) {
        // Disable old individual free models to hide them
        await sql`
          UPDATE models
          SET is_enabled = false
          WHERE provider_id = ${builtinProvider.id} AND model_id != 'free-models'
        `;

        // Insert/enable the single "OmniChat Free" entry
        await sql`
          INSERT INTO models (provider_id, model_id, display_name, context_window, input_cost_per_1k, output_cost_per_1k, supports_vision, is_enabled)
          VALUES (${builtinProvider.id}, 'free-models', 'OmniChat Free', 1048576, 0, 0, true, true)
          ON CONFLICT (provider_id, model_id) DO UPDATE SET display_name = 'OmniChat Free', is_enabled = true
        `;
      }
    } catch (seedErr) {
      console.error("Failed to seed free models:", seedErr);
    }

    let models;
    if (providerSlug) {
      models = await sql`
        SELECT m.*, p.name as provider_name, p.slug as provider_slug, p.is_connected
        FROM models m
        JOIN providers p ON m.provider_id = p.id
        WHERE p.slug = ${providerSlug} AND m.is_enabled = true
        ORDER BY m.display_name ASC
      `;
    } else if (connectedOnly) {
      models = await sql`
        SELECT m.*, p.name as provider_name, p.slug as provider_slug, p.is_connected
        FROM models m
        JOIN providers p ON m.provider_id = p.id
        WHERE p.is_connected = true AND m.is_enabled = true
        ORDER BY p.name ASC, m.display_name ASC
      `;
    } else {
      models = await sql`
        SELECT m.*, p.name as provider_name, p.slug as provider_slug, p.is_connected
        FROM models m
        JOIN providers p ON m.provider_id = p.id
        WHERE m.is_enabled = true
        ORDER BY p.name ASC, m.display_name ASC
      `;
    }

    return Response.json({ models });
  } catch (error) {
    console.error("GET /api/models error:", error);
    return Response.json({ error: "Failed to fetch models" }, { status: 500 });
  }
}
