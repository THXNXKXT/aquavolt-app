import dns from "dns";

const host = "db.yhwazizriqrhszbijttq.supabase.co";

console.log("Resolving:", host);

try {
  const addrs = await dns.promises.resolve4(host);
  console.log("IPv4:", addrs);
} catch (e) {
  console.log("IPv4 error:", e.code);
}

try {
  const addrs6 = await dns.promises.resolve6(host);
  console.log("IPv6:", addrs6);
} catch (e) {
  console.log("IPv6 error:", e.code);
}

// Try connection with pg
console.log("\nTesting pg connection...");
const { default: pg } = await import("pg");

const client = new pg.Client({
  connectionString: `postgresql://postgres:Faye%210989686594@db.yhwazizriqrhszbijttq.supabase.co:5432/postgres`,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const res = await client.query("SELECT current_database() as db");
  console.log("✅ Connected to:", res.rows[0].db);
  await client.end();
} catch (e) {
  console.log("❌ Connection error:", e.message);
  console.log("Code:", e.code);
}
