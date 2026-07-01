import { default as pg } from "pg";
import dns from "dns";
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const m = env.match(/DATABASE_URL="([^"]+)"/);
const url = m ? m[1] : null;

if (!url) { console.log("No DATABASE_URL"); process.exit(1); }

// Extract password from URL: postgresql://user:PASSWORD@host:port/db
const pwMatch = url.match(/\/\/[^:]+:(.+)@/);
const password = pwMatch ? pwMatch[1] : "";
console.log("Password length:", password.length);
console.log("Host from URL:", url.match(/@([^:]+)/)?.[1]);

console.log("\n1. Testing DNS resolution...");
try {
  const addrs = await dns.promises.resolve6("db.yhwazizriqrhszbijttq.supabase.co");
  const ipv6 = addrs[0];
  console.log("IPv6 resolved:", ipv6);
  
  console.log("2. Connecting via IPv6 direct...");
  const client = new pg.Client({
    host: ipv6,  // Use raw IPv6
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: password,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const res = await client.query("SELECT current_database() as db, version() as ver");
  console.log("✅ Connected to:", res.rows[0].db);
  await client.end();
} catch (e) {
  console.log("❌", e.message);
  console.log("Code:", e.code);
  
  // Last resort: try with standard pg connection string
  console.log("\n3. Trying original URL...");
  const client2 = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await client2.connect();
    console.log("✅ Connected!");
    await client2.end();
  } catch (e2) {
    console.log("❌", e2.message);
  }
}
