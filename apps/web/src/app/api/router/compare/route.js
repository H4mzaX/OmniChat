import sql from "@/app/api/utils/sql";

const PROVIDER_BASES = {
  openai: "https://api.openai.com",
  groq: "https://api.groq.com/openai",
  deepseek: "https://api.deepseek.com",
  mistral: "https://api.mistral.ai",
  xai: "https://api.x.ai",
  together: "https://api.together.xyz",
  fireworks: "https://api.fireworks.ai/inference",
  perplexity: "https://api.perplexity.ai",
  ollama: "http://localhost:11434",
  lmstudio: "http://localhost:1234",
};

async function callProvider(provider, apiKey, modelId, messages) {
  const t0 = Date.now();
  let text = "",
    inputTok = 0,
    outputTok = 0;

  try {
    let res;
    const msgs = messages.map((m) => ({ role: m.role, content: m.content }));

    if (provider.slug === "anthropic") {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: 2048,
          messages: msgs,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      text = json.content?.[0]?.text || "";
      inputTok = json.usage?.input_tokens || 0;
      outputTok = json.usage?.output_tokens || 0;
    } else if (provider.slug === "openrouter") {
      res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://omniclaude.app",
          "X-Title": "OmniClaude",
        },
        body: JSON.stringify({ model: modelId, messages: msgs }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      text = json.choices?.[0]?.message?.content || "";
      inputTok = json.usage?.prompt_tokens || 0;
      outputTok = json.usage?.completion_tokens || 0;
    } else {
      const base = PROVIDER_BASES[provider.slug] || provider.base_url;
      res = await fetch(`${base}/v1/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey || "ollama"}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelId,
          messages: msgs,
          max_tokens: 2048,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      text = json.choices?.[0]?.message?.content || "";
      inputTok = json.usage?.prompt_tokens || 0;
      outputTok = json.usage?.completion_tokens || 0;
    }

    return {
      model_id: modelId,
      provider_slug: provider.slug,
      provider_name: provider.name,
      content: text,
      latency_ms: Date.now() - t0,
      input_tokens: inputTok,
      output_tokens: outputTok,
      error: null,
    };
  } catch (err) {
    return {
      model_id: modelId,
      provider_slug: provider.slug,
      provider_name: provider.name,
      content: null,
      latency_ms: Date.now() - t0,
      input_tokens: 0,
      output_tokens: 0,
      error: err.message,
    };
  }
}

/* ─── POST /api/router/compare ─────────────────────────────── */
export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt, models, session_id } = body;

    if (!prompt || !Array.isArray(models) || models.length < 2) {
      return Response.json(
        {
          error:
            "Required: prompt (string), models (array of {model_id, provider_slug}, min 2)",
        },
        { status: 400 },
      );
    }
    if (models.length > 6) {
      return Response.json(
        { error: "Max 6 models per compare" },
        { status: 400 },
      );
    }

    // Build user messages context
    const messages = session_id
      ? await sql`SELECT role, content FROM messages WHERE session_id = ${session_id} AND role IN ('user','assistant') ORDER BY created_at ASC LIMIT 20`
      : [];
    const contextMsgs = [...messages, { role: "user", content: prompt }];

    // Resolve providers + keys
    const resolved = await Promise.all(
      models.map(async ({ model_id, provider_slug }) => {
        const [prov] =
          await sql`SELECT * FROM providers WHERE slug = ${provider_slug} LIMIT 1`;
        const [key] = prov
          ? await sql`SELECT full_key FROM api_keys WHERE provider_id = ${prov.id} LIMIT 1`
          : [null];
        return { provider: prov, apiKey: key?.full_key, model_id };
      }),
    );

    // Run in parallel
    const results = await Promise.all(
      resolved.map(({ provider, apiKey, model_id }) => {
        if (!provider)
          return Promise.resolve({
            model_id,
            error: "Provider not found",
            content: null,
            latency_ms: 0,
            input_tokens: 0,
            output_tokens: 0,
          });
        if (!apiKey && provider.provider_type !== "local")
          return Promise.resolve({
            model_id,
            provider_slug: provider.slug,
            provider_name: provider.name,
            error: "No API key",
            content: null,
            latency_ms: 0,
            input_tokens: 0,
            output_tokens: 0,
          });
        return callProvider(provider, apiKey, model_id, contextMsgs);
      }),
    );

    // Enrich with cost
    const enriched = await Promise.all(
      results.map(async (r) => {
        if (!r.model_id) return r;
        const [m] =
          await sql`SELECT input_cost_per_1k, output_cost_per_1k FROM models WHERE model_id = ${r.model_id} LIMIT 1`;
        const cost = m
          ? (r.input_tokens / 1000) * parseFloat(m.input_cost_per_1k || 0) +
            (r.output_tokens / 1000) * parseFloat(m.output_cost_per_1k || 0)
          : 0;
        return { ...r, estimated_cost: cost };
      }),
    );

    return Response.json({ prompt, results: enriched });
  } catch (err) {
    console.error("/api/router/compare:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
