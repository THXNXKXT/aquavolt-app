import fs from "fs";
import pg from "pg";

const env = fs.readFileSync(".env", "utf8");
const match = env.match(/DATABASE_URL="([^"]+)"/);
if (!match) { console.log("No DATABASE_URL"); process.exit(1); }

// Remove channel_binding and change sslmode
let url = match[1]
  .replace(/&channel_binding=[^&]+/, "")
  .replace(/sslmode=require/, "sslmode=verify-full");

console.log("Connecting with:", url.substring(0, 40) + "...");

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  const res = await client.query("SELECT current_database() as db, version() as ver");
  console.log("Connected to:", res.rows[0].db);
  console.log("Version:", res.rows[0].ver);
  await client.end();
  
  // Now run migrations via drizzle
  console.log("\nRunning drizzle-kit migrate...");
  const { execSync } = await import("child_process");
  execSync("npx drizzle-kit migrate", { stdio: "inherit", cwd: "D:/Projects/aquavolt-app" });
} catch (e) {
  console.log("Error:", e.message);
}
