import { ok, serverError, badRequest } from "../utils/response.js";
import sql from "../utils/sql.js";

export async function GET() {
  try {
    // Check PostgreSQL connection
    const pgOk = await sql`SELECT 1 AS ok`.then(() => true, () => false);

    return ok({
      database: {
        postgres: pgOk ? "connected" : "disconnected",
        sqlite: "available via /api/local/db",
      },
      storage: {
        postgres: pgOk,
        local: true,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
