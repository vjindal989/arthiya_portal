import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !url.startsWith("libsql://")) {
  console.error("Set DATABASE_URL=libsql://... and TURSO_AUTH_TOKEN=...");
  process.exit(1);
}

const db = createClient({ url, authToken });

await db.execute(`
  CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id"        TEXT NOT NULL PRIMARY KEY,
    "email"     TEXT NOT NULL,
    "token"     TEXT NOT NULL UNIQUE,
    "expires"   DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log("✓ PasswordResetToken table created in Turso");
await db.close();
