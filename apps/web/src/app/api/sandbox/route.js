import { ok, badRequest, serverError } from "../utils/response";
import { rateLimit } from "../utils/rateLimit";
import { logError } from "../utils/logger";

const SANDBOX_IMAGES = {
  python: "python:3.12-alpine",
  javascript: "node:22-alpine",
  js: "node:22-alpine",
  typescript: "node:22-alpine",
  ts: "node:22-alpine",
  bash: "alpine:latest",
  sh: "alpine:latest",
  ruby: "ruby:3.3-alpine",
  go: "golang:1.23-alpine",
  rust: "rust:1.80-alpine",
  c: "gcc:14-bookworm",
  cpp: "gcc:14-bookworm",
  "c++": "gcc:14-bookworm",
};

const DOCKER_SOCKET = process.env.DOCKER_SOCKET || "/var/run/docker.sock";
const DOCKER_HOST = process.env.DOCKER_HOST || null;

function dockerRequest(method, path, body = null) {
  const url = DOCKER_HOST
    ? `http://${DOCKER_HOST}${path}`
    : `http://localhost${path}`;

  const fetchOpts = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (!DOCKER_HOST) {
    // Use Unix socket via fetch
    fetchOpts.agent = new (require("undici").ProxyAgent)({
      uri: `unix://${DOCKER_SOCKET}:`,
    });
  }

  if (body) fetchOpts.body = JSON.stringify(body);
  return fetch(url, fetchOpts);
}

export async function GET() {
  try {
    const imageList = Object.entries(SANDBOX_IMAGES).map(([lang, image]) => ({
      language: lang,
      image,
    }));

    return ok({
      available: true,
      mode: DOCKER_HOST ? "tcp" : "unix-socket",
      languages: imageList,
      note: "Requires Docker daemon running on the host",
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request) {
  const rl = rateLimit({ max: 10, windowMs: 60000 });
  const limit = rl(request);
  if (limit) return limit;

  try {
    const body = await request.json();
    const { language, code, timeout_secs = 10 } = body;

    if (!code?.trim()) return badRequest("code is required");
    if (!language) return badRequest("language is required");

    const image = SANDBOX_IMAGES[language.toLowerCase()];
    if (!image) {
      return badRequest(
        `Unsupported language: ${language}. Supported: ${Object.keys(SANDBOX_IMAGES).join(", ")}`,
      );
    }

    // Run code in Docker container
    const result = await runInDocker(image, language, code, timeout_secs);
    return ok(result);
  } catch (error) {
    logError("sandbox", error);
    return serverError(error);
  }
}

async function runInDocker(image, language, code, timeoutSecs) {
  const containerName = `oc-sandbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const cmd = buildCommand(language, code);
  const containerConfig = {
    Image: image,
    Cmd: cmd,
    NetworkDisabled: true,
    ReadonlyRootfs: true,
    HostConfig: {
      Memory: 256 * 1024 * 1024,
      MemorySwap: 0,
      CpuShares: 512,
      PidsLimit: 50,
      SecurityOpt: ["no-new-privileges:true"],
      CapDrop: ["ALL"],
      ReadonlyRootfs: true,
      Tmpfs: { "/tmp": "noexec,nosuid,size=64M" },
    },
  };

  try {
    // Create container
    const createRes = await dockerRequest(
      "POST",
      `/containers/create?name=${containerName}`,
      containerConfig,
    );
    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Create failed: ${err.slice(0, 200)}`);
    }
    const { Id: containerId } = await createRes.json();

    // Start container
    await dockerRequest("POST", `/containers/${containerId}/start`);

    // Wait for container
    const waitPromise = dockerRequest(
      "POST",
      `/containers/${containerId}/wait`,
    ).then((r) => r.json());

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), timeoutSecs * 1000 + 2000),
    );

    let exitCode = -1;
    try {
      const waitResult = await Promise.race([waitPromise, timeoutPromise]);
      exitCode = waitResult.StatusCode ?? -1;
    } catch {
      // Timeout - kill the container
      await dockerRequest("DELETE", `/containers/${containerId}?force=true`).catch(() => {});
      return {
        language,
        exit_code: -1,
        stdout: "",
        stderr: "",
        timed_out: true,
        sandboxed: true,
      };
    }

    // Get logs
    const logsRes = await dockerRequest(
      "GET",
      `/containers/${containerId}/logs?stdout=true&stderr=true`,
    );
    const logData = await logsRes.text();

    // Cleanup
    await dockerRequest("DELETE", `/containers/${containerId}?force=true`).catch(() => {});

    return {
      language,
      exit_code: exitCode,
      stdout: logData,
      stderr: "",
      timed_out: false,
      sandboxed: true,
    };
  } catch (error) {
    return {
      language,
      error: error.message,
      sandboxed: true,
    };
  }
}

function buildCommand(language, code) {
  const cmds = {
    python: ["python3", "-c", code],
    javascript: ["node", "-e", code],
    js: ["node", "-e", code],
    typescript: ["npx", "tsx", "-e", code],
    ts: ["npx", "tsx", "-e", code],
    bash: ["sh", "-c", code],
    sh: ["sh", "-c", code],
    ruby: ["ruby", "-e", code],
    go: ["sh", "-c", `cat > /tmp/main.go << 'GOEOF'\n${code}\nGOEOF\ngo run /tmp/main.go`],
    rust: ["sh", "-c", `cat > /tmp/main.rs << 'RSEOF'\n${code}\nRSEOF\nrustc /tmp/main.rs -o /tmp/main && /tmp/main`],
    c: ["sh", "-c", `cat > /tmp/main.c << 'CEOF'\n${code}\nCEOF\ngcc -o /tmp/main /tmp/main.c && /tmp/main`],
    cpp: ["sh", "-c", `cat > /tmp/main.cpp << 'CPPEOF'\n${code}\nCPPEOF\ng++ -o /tmp/main /tmp/main.cpp && /tmp/main`],
    "c++": ["sh", "-c", `cat > /tmp/main.cpp << 'CPPEOF'\n${code}\nCPPEOF\ng++ -o /tmp/main /tmp/main.cpp && /tmp/main`],
  };
  return cmds[language.toLowerCase()] || ["sh", "-c", code];
}
