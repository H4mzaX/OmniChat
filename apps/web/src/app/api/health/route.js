import sql from "../utils/sql.js";
import { ok, serverError } from "../utils/response.js";

export async function GET() {
  try {
    const dbOk = await sql`SELECT 1 AS ok`.then(
      () => true,
      () => false,
    );

    const [modelCount] = dbOk
      ? await sql`SELECT COUNT(*)::int AS count FROM models`
      : [{ count: 0 }];

    const [sessionCount] = dbOk
      ? await sql`SELECT COUNT(*)::int AS count FROM chat_sessions`
      : [{ count: 0 }];

    const [providerCount] = dbOk
      ? await sql`SELECT COUNT(*)::int AS count FROM providers`
      : [{ count: 0 }];

    return ok({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbOk ? "connected" : "disconnected",
      counts: {
        models: modelCount.count,
        sessions: sessionCount.count,
        providers: providerCount.count,
      },
      node: process.version,
      env: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    return serverError(error);
  }
}
