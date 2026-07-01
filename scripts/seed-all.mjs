import { default as pg } from "pg";
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const match = env.match(/DATABASE_URL="([^"]+)"/);
const url = match[1];

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log("Connected. Clearing old data...");

await client.query("DROP TABLE IF EXISTS activities, invoices, meter_readings, tenants, utility_rates, rooms, settings, buildings CASCADE");
console.log("✓ Tables dropped");

console.log("Running migration...");
const migrationFiles = fs.readdirSync("drizzle").filter(f => f.endsWith(".sql")).sort();
const migrationSQL = fs.readFileSync("drizzle/" + migrationFiles[migrationFiles.length - 1], "utf8");
await client.query(migrationSQL);
console.log("✓ Migration applied\n");

// ─── BUILDINGS ───
await client.query("INSERT INTO buildings VALUES ($1,$2,$3)", ["bld-001","อาคาร A","123/1 ถ.สุขุมวิท ..."]);
await client.query("INSERT INTO buildings VALUES ($1,$2,$3)", ["bld-002","อาคาร B","456/2 ถ.พหลโยธิน ..."]);
console.log("✓ 2 buildings");

// ─── ROOMS ───
const rooms = [
  ["room-001","bld-001","A101",1,"occupied",4500],["room-002","bld-001","A102",1,"occupied",4500],
  ["room-003","bld-001","A103",1,"vacant",4500],["room-004","bld-001","A201",2,"occupied",5000],
  ["room-005","bld-001","A202",2,"vacant",5000],["room-006","bld-001","A203",2,"occupied",5000],
  ["room-007","bld-001","A301",3,"occupied",5500],["room-008","bld-001","A302",3,"maintenance",5500],
  ["room-009","bld-002","B101",1,"occupied",3800],["room-010","bld-002","B102",1,"occupied",3800],
  ["room-011","bld-002","B103",1,"vacant",3800],["room-012","bld-002","B201",2,"occupied",4200],
  ["room-013","bld-002","B202",2,"vacant",4200],["room-014","bld-002","B203",2,"occupied",4200],
  ["room-015","bld-002","B301",3,"occupied",4500],["room-016","bld-002","B302",3,"vacant",4500],
];
for (const r of rooms) await client.query("INSERT INTO rooms VALUES ($1,$2,$3,$4,$5,$6)", r);
console.log("✓ " + rooms.length + " rooms");

// ─── TENANTS ───
const tenants = [
  ["ten-001","room-001","สมชาย ใจดี","081-234-5678","somchai_jd","2026-01-15",12,true],
  ["ten-002","room-002","สมหญิง รักดี","082-345-6789","somying_rd","2026-02-01",12,true],
  ["ten-003","room-004","มานี มีสุข","083-456-7890","manee_ms","2026-03-01",6,true],
  ["ten-004","room-006","ชูชัย มากมี","084-567-8901","chuchai_mm","2026-03-15",12,true],
  ["ten-005","room-007","วิภา สดใส","085-678-9012","wipha_sd","2026-04-01",12,true],
  ["ten-006","room-009","วันดี พรหมมา","086-789-0123","wandi_pm","2026-02-15",24,true],
  ["ten-007","room-010","ประเสริฐ ทรัพย์ทวี","087-890-1234","prasert_st","2026-03-01",12,true],
  ["ten-008","room-012","น้องหญิง พิมพา","088-901-2345","nongying_pp","2026-02-01",6,true],
  ["ten-009","room-014","ก้องเกียรติ กล้าหาญ","089-012-3456","kongkiat_kl","2026-04-15",12,true],
  ["ten-010","room-015","วิมล ทรัพย์มาก","090-123-4567","wimon_tm","2026-05-01",12,true],
];
for (const t of tenants) {
  await client.query("INSERT INTO tenants (id, room_id, name, phone, line_id, move_in_date, contract_duration, is_active) VALUES ($1,$2,$3,$4,$5,$6::date,$7,$8)", t);
}
console.log("✓ " + tenants.length + " tenants");

// ─── UTILITY RATES ───
await client.query("INSERT INTO utility_rates VALUES ($1,$2,$3,$4,$5)", ["rate-001","ค่าน้ำ","ลบ.ม.",18,true]);
await client.query("INSERT INTO utility_rates VALUES ($1,$2,$3,$4,$5)", ["rate-002","ค่าไฟ","kWh",8,true]);
await client.query("INSERT INTO utility_rates VALUES ($1,$2,$3,$4,$5)", ["rate-003","ค่าส่วนกลาง","เดือน",500,true]);
console.log("✓ 3 rates");

// ─── SETTINGS ───
const settings = [
  ["set-001","dormitory_name","AquaVolt Dormitory"],["set-002","dormitory_address","123 ถนนสุขุมวิท ..."],
  ["set-003","phone","02-123-4567"],["set-004","water_rate","18"],["set-005","electric_rate","8"],
  ["set-006","service_charge","500"],["set-007","bank_name","ธนาคารกสิกรไทย"],
  ["set-008","bank_account","123-4-56789-0"],["set-009","account_name","หอพัก AquaVolt"],
  ["set-010","promptpay_number","081-234-5678"],
];
for (const s of settings) await client.query("INSERT INTO settings VALUES ($1,$2,$3)", s);
console.log("✓ " + settings.length + " settings");

// ─── METER READINGS ───
const occupiedIds = rooms.filter(r => r[4] === "occupied").map(r => r[0]);
const readings = [];
let ri = 0;
for (const roomId of occupiedIds) {
  for (const offset of [2, 1, 0]) {
    const d = new Date(2026, 5 - offset, 1); // Mar, Apr, May
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    ri++;
    const wp = Math.floor(Math.random() * 80) + 20;
    const wc = wp + Math.floor(Math.random() * 20) + 5;
    const ep = Math.floor(Math.random() * 500) + 100;
    const ec = ep + Math.floor(Math.random() * 150) + 50;
    readings.push(["mtr-" + String(ri).padStart(3,"0"), roomId, m, y, wp, wc, ep, ec]);
  }
}
for (const r of readings) {
  await client.query("INSERT INTO meter_readings (id, room_id, month, year, water_previous, water_current, electric_previous, electric_current) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", r);
}
await client.query("UPDATE meter_readings SET water_usage = GREATEST(0, water_current - water_previous), electric_usage = GREATEST(0, electric_current - electric_previous)");
console.log("✓ " + readings.length + " meter readings");

// ─── INVOICES ───
const invs = [];
let ii = 0;
console.log("  Processing " + occupiedIds.length + " occupied rooms for invoices...");
for (const roomId of occupiedIds) {
  const room = rooms.find(r => r[0] === roomId);
  const tenant = tenants.find(t => t[1] === roomId);
  if (!room || !tenant) { console.log("  SKIP: " + roomId + " room=" + !!room + " tenant=" + !!tenant); continue; }
  const rental = Number(room[5]) || 0;
  for (const offset of [2, 1, 0]) {
    const d = new Date(2026, 5 - offset, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const meterRow = readings.find(r => r[1] === roomId && r[2] === m && r[3] === y);
    const wUsage = meterRow ? (Number(meterRow[5]) - Number(meterRow[4])) : 10;
    const eUsage = meterRow ? (Number(meterRow[7]) - Number(meterRow[6])) : 80;
    const wCost = Math.max(wUsage * 18, 0);
    const eCost = Math.max(eUsage * 8, 0);
    ii++;
    const invNo = "INV-" + y + String(m).padStart(2,"0") + "-" + String(ii).padStart(3,"0");
    const status = offset === 0 ? "pending" : offset === 1 ? (ii % 3 === 0 ? "pending" : "paid") : "paid";
    const paid = status === "paid" ? new Date(y, m - 1, 15).toISOString().split("T")[0] : null;
    const issued = new Date(y, m - 1, 5).toISOString().split("T")[0];
    const due = new Date(y, m - 1, 20).toISOString().split("T")[0];
    if (paid) {
      await client.query("INSERT INTO invoices (id, room_id, tenant_id, meter_reading_id, month, year, rental_cost, water_cost, electric_cost, service_charge, status, issued_date, due_date, paid_date, invoice_number) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::date,$13::date,$14::date,$15)", 
        ["inv-"+String(ii).padStart(3,"0"), roomId, tenant[0], meterRow ? meterRow[0] : null, m, y, rental, Math.round(wCost), Math.round(eCost), 500, status, issued, due, paid, invNo]);
    } else {
      await client.query("INSERT INTO invoices (id, room_id, tenant_id, meter_reading_id, month, year, rental_cost, water_cost, electric_cost, service_charge, status, issued_date, due_date, invoice_number) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::date,$13::date,$14)", 
        ["inv-"+String(ii).padStart(3,"0"), roomId, tenant[0], meterRow ? meterRow[0] : null, m, y, rental, Math.round(wCost), Math.round(eCost), 500, status, issued, due, invNo]);
    }
    invs.push(ii);
  }
}
console.log("✓ " + invs.length + " invoices");

// ─── ACTIVITIES ───
const typeList = ["meter","invoice","tenant","room","meter","invoice"];
const actionMap = { meter: "บันทึกมิเตอร์", invoice: "ออกใบแจ้งหนี้", tenant: "เพิ่มผู้เช่า", room: "เปลี่ยนสถานะ" };
const detailMap = {
  meter: () => "A101 · น้ำ " + (Math.floor(Math.random()*20)+10) + " หน่วย · ไฟ " + (Math.floor(Math.random()*150)+60) + " kWh",
  invoice: () => "A102 · " + (Math.floor(Math.random()*2000)+1000) + " ฿",
  tenant: () => "ผู้เช่าใหม่ · ห้อง B" + (100 + Math.floor(Math.random()*10)),
  room: () => "A" + (100 + Math.floor(Math.random()*10)) + " · เปลี่ยนสถานะ",
};

for (let i = 0; i < 12; i++) {
  const type = typeList[i % typeList.length];
  const ts = new Date(2026, 4, 17, 23 - i, 30 - i, 0).toISOString();
  await client.query("INSERT INTO activities (id, type, action, detail, created_at) VALUES ($1,$2,$3,$4,$5::timestamp)",
    ["act-"+String(i+1).padStart(3,"0"), type, actionMap[type], detailMap[type](), ts]);
}
console.log("✓ 12 activities");

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("✅ Database fully seeded! " + rooms.length + " rooms, " + readings.length + " meter readings, " + invs.length + " invoices");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
await client.end();
