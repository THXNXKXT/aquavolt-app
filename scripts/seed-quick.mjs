import { default as pg } from "pg";
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const m = env.match(/DATABASE_URL="([^"]+)"/);
const url = m[1];

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

// Clear existing data
await client.query("TRUNCATE buildings, rooms, tenants, utility_rates, meter_readings, invoices, settings, activities CASCADE");
console.log("✓ Cleared existing data");

// Buildings
await client.query(`INSERT INTO buildings (id, name, address) VALUES ($1,$2,$3)`, ["bld-001","อาคาร A","123 ..."]);
await client.query(`INSERT INTO buildings (id, name, address) VALUES ($1,$2,$3)`, ["bld-002","อาคาร B","456 ..."]);

// Rooms
const rooms = [
  ["room-001","bld-001","A101",1,"occupied",4500],["room-002","bld-001","A102",1,"occupied",4500],
  ["room-003","bld-001","A201",2,"occupied",5000],["room-004","bld-001","A202",2,"vacant",5000],
  ["room-005","bld-001","A301",3,"occupied",5500],["room-006","bld-001","A302",3,"maintenance",5500],
  ["room-007","bld-002","B101",1,"occupied",3800],["room-008","bld-002","B102",1,"occupied",3800],
  ["room-009","bld-002","B201",2,"occupied",4200],["room-010","bld-002","B202",2,"vacant",4200],
  ["room-011","bld-002","B301",3,"occupied",4500],["room-012","bld-002","B302",3,"vacant",4500],
];
for (const r of rooms) await client.query(`INSERT INTO rooms (id, building_id, room_number, floor, status, rental_fee) VALUES ($1,$2,$3,$4,$5,$6)`, r);

// Tenants
const tenants = [
  ["ten-001","room-001","สมชาย ใจดี","081-234-5678","somchai_jd","2026-01-05",12,true],
  ["ten-002","room-002","สมหญิง รักดี","082-345-6789","somying_rd","2026-01-05",6,true],
  ["ten-003","room-003","มานี มีสุข","083-456-7890","manee_ms","2026-01-10",12,true],
  ["ten-004","room-005","ชูชัย มากมี","084-567-8901","chuchai_mm","2026-02-01",6,true],
  ["ten-005","room-007","วันดี พรหมมา","085-678-9012","wandi_pm","2026-01-20",24,true],
  ["ten-006","room-008","ประเสริฐ ทรัพย์ทวี","086-789-0123","prasert_st","2026-01-20",12,true],
  ["ten-007","room-009","น้องหญิง พิมพา","087-890-1234","nongying_pp","2026-02-05",6,true],
  ["ten-008","room-011","ก้องเกียรติ กล้าหาญ","088-901-2345","kongkiat_kl","2026-02-10",12,true],
];
for (const t of tenants) await client.query(`INSERT INTO tenants (id, room_id, name, phone, line_id, move_in_date, contract_duration, is_active) VALUES ($1,$2,$3,$4,$5,$6::date,$7,$8)`, t);

// Utility rates
await client.query(`INSERT INTO utility_rates (id, name, unit, rate_per_unit, is_active) VALUES ($1,$2,$3,$4,$5)`, ["rate-001","ค่าน้ำ","ลบ.ม.",18,true]);
await client.query(`INSERT INTO utility_rates (id, name, unit, rate_per_unit, is_active) VALUES ($1,$2,$3,$4,$5)`, ["rate-002","ค่าไฟ","kWh",8,true]);
await client.query(`INSERT INTO utility_rates (id, name, unit, rate_per_unit, is_active) VALUES ($1,$2,$3,$4,$5)`, ["rate-003","ค่าส่วนกลาง","เดือน",500,true]);

// Settings
const settings = [
  ["set-001","dormitory_name","AquaVolt Dormitory"],["set-002","dormitory_address","123 ..."],
  ["set-003","phone","02-123-4567"],["set-004","water_rate","18"],["set-005","electric_rate","8"],["set-006","service_charge","500"],
  ["set-007","bank_name","ธนาคารกสิกรไทย"],["set-008","bank_account","XXX-X-XXXXX-X"],["set-009","account_name","ชื่อบัญชีหอพัก"],["set-010","promptpay_number","XXX-XXX-XXXX"],
];
for (const [id,k,v] of settings) await client.query(`INSERT INTO settings (id, key, value) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, [id,k,v]);

console.log("✅ Seed complete!");
await client.end();
