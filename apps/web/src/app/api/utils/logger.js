const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.info;

export function log(level, msg, meta = {}) {
  if (LOG_LEVELS[level] < CURRENT_LEVEL) return;
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}]`;
  if (level === "error") {
    console.error(prefix, msg, meta);
  } else if (level === "warn") {
    console.warn(prefix, msg, meta);
  } else {
    console.log(prefix, msg, Object.keys(meta).length ? meta : "");
  }
}

export function logRequest(request, meta = {}) {
  const url = new URL(request.url);
  log("info", `${request.method} ${url.pathname}`, {
    query: Object.fromEntries(url.searchParams),
    ...meta,
  });
}

export function logError(context, error) {
  log("error", `[${context}] ${error?.message}`, {
    stack: error?.stack?.split("\n").slice(0, 3).join(" "),
  });
}
