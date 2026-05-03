import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !url.startsWith("libsql://")) {
  console.error("Set DATABASE_URL=libsql://... and TURSO_AUTH_TOKEN=...");
  process.exit(1);
}

const db = createClient({ url, authToken });

// 1. Add userId columns (ignore error if already exists)
try { await db.execute(`ALTER TABLE Farmer ADD COLUMN userId TEXT NOT NULL DEFAULT ''`); console.log("✓ Farmer.userId added"); }
catch { console.log("⚠ Farmer.userId already exists"); }

try { await db.execute(`ALTER TABLE Trader ADD COLUMN userId TEXT NOT NULL DEFAULT ''`); console.log("✓ Trader.userId added"); }
catch { console.log("⚠ Trader.userId already exists"); }

// 2. Get the first admin user's ID
const result = await db.execute(`SELECT id FROM User ORDER BY createdAt ASC LIMIT 1`);
const adminId = result.rows[0]?.id;

if (!adminId) {
  console.error("No users found in database");
  process.exit(1);
}

console.log(`✓ Admin user ID: ${adminId}`);

// 3. Assign all unassigned records to admin user
const updates = await Promise.all([
  db.execute({ sql: `UPDATE Farmer SET userId = ? WHERE userId = ''`, args: [adminId] }),
  db.execute({ sql: `UPDATE Trader SET userId = ? WHERE userId = ''`, args: [adminId] }),
]);

console.log(`✓ Assigned ${updates[0].rowsAffected} farmers to admin`);
console.log(`✓ Assigned ${updates[1].rowsAffected} traders to admin`);

await db.close();
console.log("Done.");
