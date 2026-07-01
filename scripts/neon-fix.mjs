import { neon } from "@neondatabase/serverless";
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const m = env.match(/DATABASE_URL="([^"]+)"/);
const url = m[1];

// Try with the non-pooler URL (replace -pooler)
const fixedUrl = url
  .replace("-pooler", "")
  .replace(/&channel_binding=[^&]+/, "")
  .replace(/\?sslmode=require/, "?sslmode=require");

console.log("Trying Non-pooler URL...");
const sql = neon(fixedUrl);
try {
  const r = await sql`SELECT current_database() as db, version() as ver`;
  console.log("Connected to:", r[0].db);
  console.log("Version:", r[0].ver);
} catch (e) {
  console.log("neon driver error:", e.message.substring(0, 100));
  
  // Try with pg driver instead
  console.log("\nTrying pg driver with ssl=require, rejectUnauthorized=false...");
  const { default: pg } = await import("pg");
  const client = new pg.Client({ 
    connectionString: fixedUrl,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    const res = await client.query("SELECT current_database() as db");
    console.log("pg connected to:", res.rows[0].db);
    
    // Success! Update db/index.ts to use pg
    console.log("\n✅ pg driver works! Updating db/index.ts...");
    await client.end();
  } catch (e2) {
    console.log("pg error:", e2.message);
    
    // Try with just sslmode=require in the URL
    console.log("\nTrying pg with sslmode=require in URL...");
    const client2 = new pg.Client({ connectionString: url });
    try {
      await client2.connect();
      const r2 = await client2.query("SELECT 1");
      console.log("Connected with original URL!");
      await client2.end();
    } catch (e3) {
      console.log("All attempts failed:", e3.message);
      console.log("\nPlease go to https://console.neon.tech");
      console.log("1. Check if database is running (restart if needed)");
      console.log("2. Go to Project Settings → IP Allow → Add current IP");
      console.log("3. Get your current IP from: https://whatismyip.com");
    }
  }
}
