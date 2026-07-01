import { default as pg } from "pg";
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const m = env.match(/DATABASE_URL="([^"]+)"/);
const url = m[1];

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

// Update all meter readings to have water_usage and electric_usage computed
await client.query(`
  UPDATE meter_readings SET 
    water_usage = GREATEST(0, water_current - water_previous),
    electric_usage = GREATEST(0, electric_current - electric_previous)
  WHERE water_usage IS NULL OR electric_usage IS NULL
`);
const { rowCount } = await client.query("SELECT COUNT(*) as c FROM meter_readings WHERE water_usage IS NOT NULL");
console.log("✓ Updated " + rowCount + " meter readings with usage values");

await client.end();
console.log("✅ Done");
