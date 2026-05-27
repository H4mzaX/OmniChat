import { ok, badRequest, serverError, methodNotAllowed } from "../utils/response";
import { rateLimit } from "../utils/rateLimit";
import { logError } from "../utils/logger";

const AGENTS = {
  code: { name: "Code Agent", desc: "Write and execute code in a sandbox" },
  browser: { name: "Browser Agent", desc: "Browse the web and extract information" },
  research: { name: "Research Agent", desc: "Deep research on any topic" },
  terminal: { name: "Terminal Agent", desc: "Run shell commands in a sandbox" },
};

export async function GET() {
  return ok({ agents: AGENTS });
}

export async function POST(request) {
  const rl = rateLimit({ max: 20, windowMs: 60000 });
  const limit = rl(request);
  if (limit) return limit;

  try {
    const body = await request.json();
    const { agent, action, params } = body;

    if (!agent || !AGENTS[agent]) {
      return badRequest(`Unknown agent. Available: ${Object.keys(AGENTS).join(", ")}`);
    }

    if (!action) {
      return badRequest("Action is required (e.g. 'run', 'browse', 'search')");
    }

    const result = await executeAgent(agent, action, params || {});
    return ok(result);
  } catch (error) {
    logError("agent", error);
    return serverError(error);
  }
}

async function executeAgent(agent, action, params) {
  const t0 = Date.now();

  switch (agent) {
    case "code": {
      if (action === "run") {
        const { language, code } = params;
        if (!language || !code) throw Object.assign(new Error("language and code required"), { status: 400 });
        return {
          agent: "code",
          action: "run",
          language,
          code,
          output: "[sandbox execution pending - requires Docker setup]",
          duration_ms: Date.now() - t0,
        };
      }
      if (action === "analyze") {
        return {
          agent: "code",
          action: "analyze",
          analysis: "[code analysis pending]",
          duration_ms: Date.now() - t0,
        };
      }
      throw Object.assign(new Error(`Unknown action: ${action} for code agent`), { status: 400 });
    }

    case "browser": {
      if (action === "browse") {
        const { url } = params;
        if (!url) throw Object.assign(new Error("url required"), { status: 400 });
        return {
          agent: "browser",
          action: "browse",
          url,
          title: "[page title]",
          content: "[page content - requires Puppeteer/Playwright setup]",
          duration_ms: Date.now() - t0,
        };
      }
      if (action === "screenshot") {
        return {
          agent: "browser",
          action: "screenshot",
          screenshot: "[screenshot pending]",
          duration_ms: Date.now() - t0,
        };
      }
      throw Object.assign(new Error(`Unknown action: ${action} for browser agent`), { status: 400 });
    }

    case "research": {
      if (action === "search") {
        const { query } = params;
        if (!query) throw Object.assign(new Error("query required"), { status: 400 });
        return {
          agent: "research",
          action: "search",
          query,
          results: "[research results pending - requires web search API]",
          duration_ms: Date.now() - t0,
        };
      }
      if (action === "deep") {
        return {
          agent: "research",
          action: "deep",
          report: "[deep research report pending]",
          duration_ms: Date.now() - t0,
        };
      }
      throw Object.assign(new Error(`Unknown action: ${action} for research agent`), { status: 400 });
    }

    case "terminal": {
      if (action === "run") {
        const { command } = params;
        if (!command) throw Object.assign(new Error("command required"), { status: 400 });
        return {
          agent: "terminal",
          action: "run",
          command,
          stdout: "[terminal execution pending - requires sandbox setup]",
          stderr: "",
          exitCode: 0,
          duration_ms: Date.now() - t0,
        };
      }
      throw Object.assign(new Error(`Unknown action: ${action} for terminal agent`), { status: 400 });
    }

    default:
      throw Object.assign(new Error(`Unknown agent: ${agent}`), { status: 400 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: { Allow: "GET, POST, OPTIONS" },
  });
}
