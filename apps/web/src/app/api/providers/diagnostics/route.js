import sql from "../../utils/sql.js";

const TEST_ENDPOINTS = {
  anthropic: {
    url: "https://api.anthropic.com/v1/models",
    method: "GET",
    headers: (k) => ({ "x-api-key": k, "anthropic-version": "2023-06-01" }),
  },
  openai: {
    url: "https://api.openai.com/v1/models",
    method: "GET",
    headers: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  openrouter: {
    url: "https://openrouter.ai/api/v1/models",
    method: "GET",
    headers: (k) => ({
      Authorization: `Bearer ${k}`,
      "HTTP-Referer": "https://omniclaude.app",
      "X-Title": "OmniClaude",
    }),
  },
  groq: {
    url: "https://api.groq.com/openai/v1/models",
    method: "GET",
    headers: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  mistral: {
    url: "https://api.mistral.ai/v1/models",
    method: "GET",
    headers: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  deepseek: {
    url: "https://api.deepseek.com/v1/models",
    method: "GET",
    headers: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  xai: {
    url: "https://api.x.ai/v1/models",
    method: "GET",
    headers: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  together: {
    url: "https://api.together.xyz/v1/models",
    method: "GET",
    headers: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  fireworks: {
    url: "https://api.fireworks.ai/inference/v1/models",
    method: "GET",
    headers: (k) => ({ Authorization: `Bearer ${k}` }),
  },
  ollama: {
    url: "http://localhost:11434/api/tags",
    method: "GET",
    headers: () => ({}),
  },
};

async function pingProvider(slug, baseUrl, apiKey) {
  const cfg = TEST_ENDPOINTS[slug];
  const url = cfg?.url || (baseUrl ? `${baseUrl}/v1/models` : null);
  if (!url) return { ok: false, latency_ms: 0, error: "No test endpoint" };

  const t0 = Date.now();
  try {
    const headers = cfg
      ? cfg.headers(apiKey || "")
      : { Authorization: `Bearer ${apiKey}` };
    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(8000),
    });
    const latency_ms = Date.now() - t0;
    return {
      ok: res.ok || res.status === 401 /* key auth error, endpoint reachable */,
      latency_ms,
      status: res.status,
    };
  } catch (e) {
    return { ok: false, latency_ms: Date.now() - t0, error: e.message };
  }
}

export async function GET() {
  try {
    const providers = await sql`
      SELECT p.*, ak.full_key, ak.is_valid, ak.last_validated_at,
             COUNT(m.id) as model_count
      FROM providers p
      LEFT JOIN api_keys ak ON ak.provider_id = p.id
      LEFT JOIN models m ON m.provider_id = p.id AND m.is_enabled = true
      GROUP BY p.id, ak.full_key, ak.is_valid, ak.last_validated_at
      ORDER BY p.name ASC`;

    const diagnostics = await Promise.all(
      providers.map(async (p) => {
        let ping = { ok: null, latency_ms: null, error: null };
        if (p.is_connected && (p.full_key || p.provider_type === "local")) {
          ping = await pingProvider(p.slug, p.base_url, p.full_key);

          // Update validity in DB
          await sql`
            UPDATE api_keys SET is_valid = ${ping.ok}, last_validated_at = NOW()
            WHERE provider_id = ${p.id}`;
        }

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          provider_type: p.provider_type,
          base_url: p.base_url,
          is_enabled: p.is_enabled,
          is_connected: p.is_connected,
          model_count: parseInt(p.model_count) || 0,
          ping_ok: ping.ok,
          ping_latency_ms: ping.latency_ms,
          ping_error: ping.error,
          ping_status: ping.status,
          last_validated_at: p.last_validated_at,
        };
      }),
    );

    return Response.json({ diagnostics });
  } catch (err) {
    console.error("/api/providers/diagnostics:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
