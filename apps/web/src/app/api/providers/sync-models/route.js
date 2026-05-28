import sql from "../../utils/sql.js";

/* ─── OpenRouter model fetch ─────────────────────────────────
   Endpoint: GET https://openrouter.ai/api/v1/models
   Returns:  { data: [ { id, name, context_length, pricing, ... } ] }
──────────────────────────────────────────────────────────── */
async function fetchOpenRouterModels(apiKey) {
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://omnichat.app",
      "X-Title": "OmniChat",
    },
  });
  if (!res.ok)
    throw new Error(
      `OpenRouter models API error: ${res.status} ${await res.text()}`,
    );
  const json = await res.json();
  return json.data || [];
}

/* ─── Ollama local model fetch ──────────────────────────────── */
async function fetchOllamaModels(baseUrl) {
  const res = await fetch(`${baseUrl}/api/tags`, {
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const json = await res.json();
  return (json.models || []).map((m) => ({
    id: m.name,
    name: m.name.replace(":latest", ""),
    context_length: 8192,
    pricing: { prompt: "0", completion: "0" },
  }));
}

/* ─── Main handler ──────────────────────────────────────────── */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { provider_id } = body;

    let providers;
    if (provider_id) {
      providers =
        await sql`SELECT p.*, ak.full_key FROM providers p LEFT JOIN api_keys ak ON ak.provider_id = p.id WHERE p.id = ${provider_id}`;
    } else {
      providers =
        await sql`SELECT p.*, ak.full_key FROM providers p LEFT JOIN api_keys ak ON ak.provider_id = p.id WHERE p.is_connected = true`;
    }

    const results = [];

    for (const p of providers) {
      try {
        let rawModels = [];

        if (p.slug === "openrouter" && p.full_key) {
          rawModels = await fetchOpenRouterModels(p.full_key);
        } else if (p.slug === "ollama") {
          rawModels = await fetchOllamaModels(
            p.base_url || "http://localhost:11434",
          );
        } else {
          results.push({
            provider: p.slug,
            skipped: true,
            reason: "dynamic fetch not supported",
          });
          continue;
        }

        // Upsert models into DB
        let upserted = 0;
        for (const m of rawModels.slice(0, 500)) {
          // cap at 500 per provider
          const modelId = m.id || m.model_id || m.name;
          const name = m.name || m.display_name || modelId;
          const ctx = m.context_length || m.context_window || null;
          const inCost = m.pricing?.prompt
            ? parseFloat(m.pricing.prompt) * 1000
            : null;
          const outCost = m.pricing?.completion
            ? parseFloat(m.pricing.completion) * 1000
            : null;
          const hasVision =
            m.architecture?.modality?.includes("image") || false;

          await sql`
            INSERT INTO models (provider_id, model_id, display_name, context_window, input_cost_per_1k, output_cost_per_1k, supports_vision, is_enabled)
            VALUES (${p.id}, ${modelId}, ${name}, ${ctx}, ${inCost}, ${outCost}, ${hasVision}, true)
            ON CONFLICT (provider_id, model_id) DO NOTHING`;
          upserted++;
        }

        results.push({
          provider: p.slug,
          synced: upserted,
          total: rawModels.length,
        });
      } catch (provErr) {
        results.push({ provider: p.slug, error: provErr.message });
      }
    }

    return Response.json({ results });
  } catch (err) {
    console.error("/api/providers/sync-models:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
