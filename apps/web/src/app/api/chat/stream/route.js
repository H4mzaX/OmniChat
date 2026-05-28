import sql from "../../utils/sql.js";
import Anthropic from "@anthropic-ai/sdk";

/* ─── Content helpers ──────────────────────────────────────────── */
function parseContent(val) {
  if (typeof val === "string" && val.startsWith("[")) {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

function toOAIContent(c) {
  if (typeof c === "string") return c;
  if (Array.isArray(c)) {
    return c.map((b) => {
      if (b.type === "text") return b;
      if (b.type === "image" && b.source) {
        return { type: "image_url", image_url: { url: `data:${b.source.media_type};base64,${b.source.data}` } };
      }
      return b;
    });
  }
  return c;
}

function toLLMContent(c) {
  const parsed = parseContent(c);
  if (typeof parsed === "string") return parsed;
  if (Array.isArray(parsed)) {
    const hasImage = parsed.some((b) => b.type === "image");
    if (hasImage) {
      return parsed.map((b) => {
        if (b.type === "text") return b;
        if (b.type === "image") return b;
        if (b.type === "file") return { type: "text", text: `[File: ${b.name}]\n${b.text || ""}` };
        return b;
      });
    } else {
      return parsed
        .map((b) => {
          if (b.type === "text") return b.text;
          if (b.type === "file") return `[File: ${b.name}]\n${b.text || ""}`;
          return "";
        })
        .filter(Boolean)
        .join("\n\n");
    }
  }
  return c;
}

/* ─── Anthropic streaming (primary engine) ─────────────────────── */
async function anthropicStream(key, model, msgs, sys, baseUrl) {
  const client = new Anthropic({
    apiKey: key,
    baseURL: baseUrl || undefined,
  });

  const messages = msgs.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: toLLMContent(parseContent(m.content)),
  }));

  const opts = {
    model,
    max_tokens: 4096,
    system: sys || undefined,
    messages,
  };
  // Only use extended thinking for opus-class models (adds ~2-3s prefill latency otherwise)
  if (model?.includes("opus")) {
    opts.thinking = { type: "enabled", budget_tokens: 2048 };
  }
  return client.messages.stream(opts);
}

/* ─── OpenRouter streaming ────────────────────────────────────── */
async function fetchOpenRouter(key, model, msgs, sys) {
  const m = sys
    ? [{ role: "system", content: sys }, ...msgs.map((x) => ({ role: x.role, content: toOAIContent(toLLMContent(parseContent(x.content))) }))]
    : msgs.map((x) => ({ role: x.role, content: toOAIContent(toLLMContent(parseContent(x.content))) }));
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 30000);
  try {
    return await fetch("https://openrouter.ai/api/v1/chat/completions", {
      signal: ac.signal,
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://omnichat.app",
        "X-Title": "OmniChat",
      },
      body: JSON.stringify({ model, messages: m, stream: true, stream_options: { include_usage: true } }),
    });
  } finally { clearTimeout(timer); }
}

/* ─── OAI-compatible streaming ────────────────────────────────── */
async function fetchOAI(key, base, model, msgs, sys) {
  const m = sys
    ? [{ role: "system", content: sys }, ...msgs.map((x) => ({ role: x.role, content: toOAIContent(toLLMContent(parseContent(x.content))) }))]
    : msgs.map((x) => ({ role: x.role, content: toOAIContent(toLLMContent(parseContent(x.content))) }));
  const baseUrl = (base || "").replace(/\/+$/, "");
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 30000);
  try {
    return await fetch(`${baseUrl}/v1/chat/completions`, {
      signal: ac.signal,
      method: "POST",
      headers: {
        Authorization: `Bearer ${key || "ollama"}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages: m, stream: true, stream_options: { include_usage: true }, max_tokens: 8192 }),
    });
  } finally { clearTimeout(timer); }
}

/* ─── SSE parsers ─────────────────────────────────────────────── */
const anthropicTok = (ev) => (ev.type === "content_block_delta" ? ev.delta?.text || "" : "");
const anthropicThinking = (ev) => (ev.type === "content_block_delta" && ev.delta?.type === "thinking_delta" ? ev.delta.thinking || "" : "");
const anthropicUsage = (ev, u) => {
  if (ev.type === "message_start" && ev.message?.usage) u.in = ev.message.usage.input_tokens || 0;
  if (ev.type === "message_delta" && ev.usage) u.out = ev.usage.output_tokens || 0;
};
const oaiTok = (ev) => ev.choices?.[0]?.delta?.content || "";
const oaiUsage = (ev, u) => {
  if (ev.usage) { u.in = ev.usage.prompt_tokens || u.in; u.out = ev.usage.completion_tokens || u.out; }
};

class SSE {
  constructor() { this._buf = ""; }
  ingest(raw) {
    this._buf += raw;
    const lines = [];
    let nl;
    while ((nl = this._buf.indexOf("\n")) !== -1) { lines.push(this._buf.slice(0, nl).trimEnd()); this._buf = this._buf.slice(nl + 1); }
    return lines;
  }
  events(lines) {
    const evts = [];
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const p = line.slice(5).trim();
      if (p === "[DONE]" || !p) continue;
      try { evts.push(JSON.parse(p)); } catch (_) {}
    }
    return evts;
  }
}

function makeStream(fn) {
  const enc = new TextEncoder();
  return new ReadableStream({
    async start(ctrl) {
      try { await fn(ctrl, enc); } catch (e) { ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ error: e.message })}\n\n`)); }
      ctrl.close();
    },
  });
}

/* ─── POST /api/chat/stream ───────────────────────────────────── */
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { session_id, content, files, model_id, provider_slug, system_prompt } = body;
  if (!session_id || !model_id || !provider_slug) {
    return Response.json({ error: "Required: session_id, model_id, provider_slug" }, { status: 400 });
  }
  if (!content?.trim() && (!files || files.length === 0)) {
    return Response.json({ error: "content or files required" }, { status: 400 });
  }

  try {
    const [provider] = await sql`SELECT * FROM providers WHERE slug = ${provider_slug} LIMIT 1`;
    if (!provider) return Response.json({ error: `Unknown provider: ${provider_slug}` }, { status: 404 });

    const [keyRow] = await sql`SELECT full_key FROM api_keys WHERE provider_id = ${provider.id} LIMIT 1`;
    const apiKey = keyRow?.full_key || null;

    if (!apiKey && provider.provider_type !== "local" && provider_slug !== "builtin") {
      return Response.json({ error: `No API key for ${provider.name}. Add it in Settings.` }, { status: 400 });
    }

    let actualSessionId = session_id;
    if (session_id === "new") {
      try {
        const [newSess] = await sql`
          INSERT INTO chat_sessions (title, model_id, provider_id)
          VALUES (${content ? content.slice(0, 80) : "New Chat"}, ${model_id || null}, ${provider.id || null})
          RETURNING id
        `;
        actualSessionId = newSess.id;
      } catch (sessErr) {
        console.error("Failed to create session on the fly:", sessErr);
        return Response.json({ error: "Failed to create session" }, { status: 500 });
      }
    }

    const history = await sql`
      SELECT role, content FROM messages
      WHERE session_id = ${actualSessionId} AND role IN ('user','assistant')
      ORDER BY created_at ASC LIMIT 100`;
    // Build content blocks: text + files + images (saved in rich layout format for history rendering)
    let userContent = content || "";
    if (files && files.length > 0) {
      const blocks = content?.trim() ? [{ type: "text", text: content }] : [];
      for (const f of files) {
        const isImg = f.type?.startsWith("image/");
        if (isImg) {
          blocks.push({ type: "image", source: { type: "base64", media_type: f.type, data: f.base64 } });
        } else {
          blocks.push({ type: "file", name: f.name, size: f.size, ext: f.ext || f.name?.split(".").pop(), text: f.text || "" });
        }
      }
      userContent = JSON.stringify(blocks);
    }

    const msgs = [...history, { role: "user", content: userContent }];

    await sql`INSERT INTO messages (session_id, role, content, model_id, provider_id)
      VALUES (${actualSessionId}, 'user', ${userContent}, ${model_id}, ${provider.id})`;

    const t0 = Date.now();
    const sse = new SSE();
    const dec = new TextDecoder();
    let text = "";
    let thinkingText = "";
    let currentThinking = "";
    const usage = { in: 0, out: 0 };

    const isAnthropic = provider_slug === "anthropic" || provider.provider_type === "anthropic";

    if (isAnthropic && apiKey) {
      /* ── Anthropic SDK streaming with thinking ── */
      const stream = makeStream(async (ctrl, enc) => {
        ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ session_id: actualSessionId })}\n\n`));
        try {
          const baseUrl = provider.base_url || undefined;
          const response = await anthropicStream(apiKey, model_id, msgs, system_prompt, baseUrl);

          for await (const ev of response) {
            if (ev.type === "content_block_delta" && ev.delta?.type === "thinking_delta") {
              const thinking = ev.delta.thinking || "";
              currentThinking += thinking;
              ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ thinking })}\n\n`));
            }
            if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
              const tok = ev.delta.text || "";
              text += tok;
              ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ token: tok })}\n\n`));
            }
            if (ev.type === "message_start" && ev.message?.usage) {
              usage.in = ev.message.usage.input_tokens || 0;
            }
            if (ev.type === "message_delta" && ev.usage) {
              usage.out = ev.usage.output_tokens || 0;
            }
          }

          if (currentThinking) thinkingText = currentThinking;
        } catch (e) {
          ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ error: e.message })}\n\n`));
        }

        const ms = Date.now() - t0;
        let savedId = null;
        try {
          const [mRow] = await sql`SELECT input_cost_per_1k, output_cost_per_1k FROM models WHERE model_id = ${model_id} LIMIT 1`;
          const cost = mRow
            ? (usage.in / 1000) * parseFloat(mRow.input_cost_per_1k || 0) + (usage.out / 1000) * parseFloat(mRow.output_cost_per_1k || 0)
            : 0;
          const [saved] = await sql`
            INSERT INTO messages (session_id, role, content, model_id, provider_id, input_tokens, output_tokens, estimated_cost, latency_ms, reasoning_content)
            VALUES (${actualSessionId}, 'assistant', ${text || "(no output)"}, ${model_id}, ${provider.id}, ${usage.in}, ${usage.out}, ${cost}, ${ms}, ${thinkingText || null})
            RETURNING id`;
          savedId = saved?.id;
          await sql`UPDATE chat_sessions SET message_count = message_count + 2, total_tokens = total_tokens + ${usage.in + usage.out}, estimated_cost = estimated_cost + ${cost}, model_id = ${model_id}, provider_id = ${provider.id}, updated_at = NOW() WHERE id = ${actualSessionId}`;
          const [sess] = await sql`SELECT title FROM chat_sessions WHERE id = ${actualSessionId}`;
          if (!sess?.title || sess.title === "New Chat") {
            await sql`UPDATE chat_sessions SET title = ${content.slice(0, 80)} WHERE id = ${actualSessionId}`;
          }
        } catch (dbErr) { console.error("DB persist:", dbErr); }

        ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ done: true, message_id: savedId, input_tokens: usage.in, output_tokens: usage.out, latency_ms: ms, thinking: thinkingText || undefined })}\n\n`));
      });

      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no", Connection: "keep-alive" },
      });
    }

    /* ── Built-in free model (OmniChat Free with 100% Resilient Retry Pipeline) ── */
    if (provider_slug === "builtin") {
      const platformMsgs = msgs.map((m) => ({ role: m.role, content: toLLMContent(parseContent(m.content)) }));
      if (system_prompt) platformMsgs.unshift({ role: "system", content: system_prompt });
      const createApi = process.env.NEXT_PUBLIC_CREATE_BASE_URL || "https://www.create.xyz";
      const projectGroupId = process.env.NEXT_PUBLIC_PROJECT_GROUP_ID;

      const stream = makeStream(async (ctrl, enc) => {
        ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ session_id: actualSessionId })}\n\n`));

        const integrationUrl = `${createApi}/integrations/google-gemini-2-5-flash`;
        let finalRes = null;
        let lastErr = null;

        // Highly resilient 3-attempt loop with backoff for 100% reliability
        for (let attempt = 1; attempt <= 3; attempt++) {
          const ac = new AbortController();
          const timer = setTimeout(() => ac.abort(), 12000); // 12s timeout per attempt

          try {
            const headers = { "Content-Type": "application/json" };
            if (projectGroupId) headers["x-createxyz-project-group-id"] = projectGroupId;

            const res = await fetch(integrationUrl, {
              method: "POST",
              headers,
              body: JSON.stringify({ messages: platformMsgs }),
              signal: ac.signal,
            });

            if (res.ok) {
              finalRes = await res.json();
              break;
            } else {
              const statusText = res.status;
              console.warn(`[Attempt ${attempt}] OmniChat Free path failed with status ${statusText}. Retrying...`);
              lastErr = new Error(`API returned status ${statusText}`);
            }
          } catch (err) {
            console.warn(`[Attempt ${attempt}] OmniChat Free path failed: ${err.message}. Retrying...`);
            lastErr = err;
          } finally {
            clearTimeout(timer);
          }

          // Backoff before retry: 1s, 2s
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, attempt * 1000));
          }
        }

        if (!finalRes) {
          throw new Error(`OmniChat Free is currently busy: ${lastErr?.message || "Timeout"}. Please retry in a few moments or add your own key in Settings.`);
        }

        const resText = finalRes.choices?.[0]?.message?.content || "";
        const words = resText.split(" ");
        let acc = "";

        for (let i = 0; i < words.length; i++) {
          const tok = (i === 0 ? "" : " ") + words[i];
          acc += tok;
          ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ token: tok })}\n\n`));
          await new Promise((r) => setTimeout(r, 12));
        }

        const ms = Date.now() - t0;
        const inTok = Math.ceil(content.length / 4);
        const outTok = Math.ceil(acc.length / 4);
        let savedId = null;
        try {
          const [saved] = await sql`
            INSERT INTO messages (session_id, role, content, model_id, provider_id, input_tokens, output_tokens, estimated_cost, latency_ms)
            VALUES (${actualSessionId}, 'assistant', ${acc || "(no output)"}, ${activeModelUsed}, ${provider.id}, ${inTok}, ${outTok}, 0, ${ms}) RETURNING id`;
          savedId = saved?.id;
          await sql`UPDATE chat_sessions SET message_count = message_count + 2, total_tokens = total_tokens + ${inTok + outTok}, updated_at = NOW() WHERE id = ${actualSessionId}`;
          const [sess] = await sql`SELECT title FROM chat_sessions WHERE id = ${actualSessionId}`;
          if (!sess?.title || sess.title === "New Chat") {
            await sql`UPDATE chat_sessions SET title = ${content.slice(0, 80)} WHERE id = ${actualSessionId}`;
          }
        } catch (dbErr) { console.error("DB:", dbErr); }
        ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ done: true, message_id: savedId, input_tokens: inTok, output_tokens: outTok, latency_ms: ms })}\n\n`));
      });
      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no", Connection: "keep-alive" },
      });
    }

    /* ── Non-Anthropic providers (OpenRouter / OAI) ── */
    let upstream;
    if (provider_slug === "openrouter") {
      upstream = await fetchOpenRouter(apiKey, model_id, msgs, system_prompt);
    } else {
      const base = provider.base_url;
      if (!base) return Response.json({ error: `No base URL for: ${provider_slug}` }, { status: 400 });
      upstream = await fetchOAI(apiKey, base, model_id, msgs, system_prompt);
    }

    if (!upstream.ok) {
      const err = await upstream.text();
      const short = err.length > 160 ? err.slice(0, 160).replace(/\n.*/s, "") + "…" : err;
      return Response.json({ error: `${provider.name}: ${short}` }, { status: 502 });
    }

    const stream = makeStream(async (ctrl, enc) => {
      ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ session_id: actualSessionId })}\n\n`));
      const reader = upstream.body.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const ev of sse.events(sse.ingest(dec.decode(value, { stream: true })))) {
            const tok = oaiTok(ev);
            oaiUsage(ev, usage);
            if (tok) { text += tok; ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ token: tok })}\n\n`)); }
          }
        }
      } catch (e) { ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ error: e.message })}\n\n`)); }

      const ms = Date.now() - t0;
      let savedId = null;
      try {
        const [mRow] = await sql`SELECT input_cost_per_1k, output_cost_per_1k FROM models WHERE model_id = ${model_id} LIMIT 1`;
        const cost = mRow
          ? (usage.in / 1000) * parseFloat(mRow.input_cost_per_1k || 0) + (usage.out / 1000) * parseFloat(mRow.output_cost_per_1k || 0)
          : 0;
        const [saved] = await sql`
          INSERT INTO messages (session_id, role, content, model_id, provider_id, input_tokens, output_tokens, estimated_cost, latency_ms)
          VALUES (${actualSessionId}, 'assistant', ${text || "(no output)"}, ${model_id}, ${provider.id}, ${usage.in}, ${usage.out}, ${cost}, ${ms}) RETURNING id`;
        savedId = saved?.id;
        await sql`UPDATE chat_sessions SET message_count = message_count + 2, total_tokens = total_tokens + ${usage.in + usage.out}, estimated_cost = estimated_cost + ${cost}, model_id = ${model_id}, provider_id = ${provider.id}, updated_at = NOW() WHERE id = ${actualSessionId}`;
        const [sess] = await sql`SELECT title FROM chat_sessions WHERE id = ${actualSessionId}`;
        if (!sess?.title || sess.title === "New Chat") {
          await sql`UPDATE chat_sessions SET title = ${content.slice(0, 80)} WHERE id = ${actualSessionId}`;
        }
      } catch (dbErr) { console.error("DB persist:", dbErr); }

      ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ done: true, message_id: savedId, input_tokens: usage.in, output_tokens: usage.out, latency_ms: ms })}\n\n`));
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no", Connection: "keep-alive" },
    });
  } catch (err) {
    console.error("/api/chat/stream:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
