let initSQL = null;
let db = null;

export async function getLocalDb() {
  if (db) return db;

  if (!initSQL) {
    const SQL = await import("sql.js");
    initSQL = SQL.default;
  }

  // Try loading from localStorage
  const saved = typeof window !== "undefined" ? localStorage.getItem("omniclaude_local_db") : null;
  if (saved) {
    const buffer = Buffer.from(saved, "base64");
    db = new initSQL.Database(buffer);
  } else {
    db = new initSQL.Database();
  }

  // Ensure schema exists
  db.run(`
    CREATE TABLE IF NOT EXISTS local_sessions (
      id TEXT PRIMARY KEY,
      title TEXT DEFAULT 'New Chat',
      model_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      message_count INTEGER DEFAULT 0
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS local_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      role TEXT,
      content TEXT,
      model_id TEXT,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES local_sessions(id)
    )
  `);

  return db;
}

export function persistLocalDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  if (typeof window !== "undefined") {
    localStorage.setItem("omniclaude_local_db", buffer.toString("base64"));
  }
}

export function closeDb() {
  if (db) db.close();
  db = null;
}
