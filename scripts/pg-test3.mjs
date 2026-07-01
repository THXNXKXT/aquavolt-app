import fs from "fs";
import pg from "pg";

const env = fs.readFileSync(".env", "utf8");
const match = env.match(/DATABASE_URL="([^"]+)"/);
if (!match) { console.log("No DATABASE_URL"); process.exit(1); }

let url = match[1]
  .replace(/&channel_binding=[^&]+/, "")
  .replace(/sslmode=[^&]+/, "")
  .replace(/\?[^&]+/, "?sslmode=disable");

console.log("URL:", url.substring(0, 40) + "...");

const client = new pg.Client({ connectionString: url });
try {
  await client.connect();
  const res = await client.query("SELECT 1 as ok");
  console.log("Connected!", res.rows[0]);
  await client.end();
} catch (e) {
  console.log("Error:", e.message);
}
