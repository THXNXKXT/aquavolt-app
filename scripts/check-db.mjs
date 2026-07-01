import { neon } from "@neondatabase/serverless";
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const match = env.match(/DATABASE_URL="([^"]+)"/);
if (!match) { console.log("No DATABASE_URL found"); process.exit(1); }

const url = match[1];
console.log("URL starts with:", url.substring(0, 30) + "...");

const sql = neon(url);
try {
  const result = await sql`SELECT current_database() as db, version() as ver`;
  console.log("Connected to database:", result[0].db);
} catch (e) {
  console.log("Connection error:", e.message);
  console.log("Cause:", e.cause?.message || "unknown");
  
  // Try alternative connection without pooler
  const altUrl = url.replace("-pooler", "");
  console.log("\nTrying without pooler...");
  const sql2 = neon(altUrl);
  try {
    const r2 = await sql2`SELECT 1 as ok`;
    console.log("Alternative connection OK:", r2);
  } catch (e2) {
    console.log("Alternative also failed:", e2.message);
  }
}
