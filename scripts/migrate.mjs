import { default as pg } from "pg";
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const m = env.match(/DATABASE_URL="([^"]+)"/);
const url = m[1];

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log("✅ Connected");

// Drop everything and recreate
await client.query("DROP TABLE IF EXISTS activities, invoices, meter_readings, tenants, utility_rates, rooms, settings, buildings, __drizzle_migrations CASCADE");
console.log("✓ Dropped tables");

// Find latest migration
const files = fs.readdirSync("drizzle").filter(f => f.endsWith(".sql")).sort();
const latest = files[files.length - 1];
console.log("Running:", latest);

const sql = fs.readFileSync("drizzle/" + latest, "utf8");
await client.query(sql);
console.log("✓ Migration applied");

await client.end();
console.log("✅ Database ready!");
