import fs from "fs";
import pg from "pg";

const env = fs.readFileSync(".env", "utf8");
const match = env.match(/DATABASE_URL="([^"]+)"/);
if (!match) { console.log("No DATABASE_URL"); process.exit(1); }

const client = new pg.Client({ connectionString: match[1] });
try {
  await client.connect();
  const res = await client.query("SELECT current_database() as db");
  console.log("Connected to:", res.rows[0].db);
  await client.end();
} catch (e) {
  console.log("PG connection error:", e.message);
}
