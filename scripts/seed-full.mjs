import { default as pg } from "pg";
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const m = env.match(/DATABASE_URL="([^"]+)"/);
const url = m[1];

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
console.log("Seeding all data...\n");

// Clear all data
await client.query("TRUNCATE meter_readings, invoices, activities CASCADE");

// ─── Meter readings ───
const readings = [
  ["mtr-001","room-001",3,2026,100,115,500,620],
  ["mtr-002","room-002",3,2026,80,90,300,390],
  ["mtr-003","room-003",3,2026,50,62,200,290],
  ["mtr-004","room-005",3,2026,20,30,100,180],
  ["mtr-005","room-007",3,2026,40,52,150,230],
  ["mtr-006","room-008",3,2026,60,74,250,360],
  ["mtr-007","room-009",3,2026,10,19,50,120],
  ["mtr-008","room-011",3,2026,5,13,20,90],
  ["mtr-009","room-001",4,2026,115,132,620,750],
  ["mtr-010","room-002",4,2026,90,105,390,500],
  ["mtr-011","room-003",4,2026,62,76,290,395],
  ["mtr-012","room-005",4,2026,30,42,180,270],
  ["mtr-013","room-007",4,2026,52,66,230,330],
  ["mtr-014","room-008",4,2026,74,90,360,480],
  ["mtr-015","room-009",4,2026,19,30,120,200],
  ["mtr-016","room-011",4,2026,13,23,90,170],
  ["mtr-017","room-001",5,2026,132,150,750,890],
  ["mtr-018","room-002",5,2026,105,120,500,620],
  ["mtr-019","room-003",5,2026,76,90,395,510],
  ["mtr-020","room-005",5,2026,42,53,270,370],
  ["mtr-021","room-007",5,2026,66,80,330,440],
  ["mtr-022","room-008",5,2026,90,108,480,610],
  ["mtr-023","room-009",5,2026,30,42,200,290],
  ["mtr-024","room-011",5,2026,23,34,170,260],
];
for (const r of readings) {
  await client.query(`INSERT INTO meter_readings (id, room_id, month, year, water_previous, water_current, electric_previous, electric_current) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`, r);
}
console.log("✓ " + readings.length + " meter readings");

// ─── Invoices ───
const invs = [
  // [id, room_id, tenant_id, reading_id, month, year, rent, water, elec, svc, status, issued, due, paid, inv_no]
  ["inv-001","room-001","ten-001","mtr-001",3,2026,4500,270,960,500,"paid","2026-03-05","2026-03-20","2026-03-18","INV-202603-001"],
  ["inv-002","room-002","ten-002","mtr-002",3,2026,4500,180,720,500,"paid","2026-03-05","2026-03-20","2026-03-19","INV-202603-002"],
  ["inv-003","room-003","ten-003","mtr-003",3,2026,5000,216,720,500,"paid","2026-03-05","2026-03-20","2026-03-15","INV-202603-003"],
  ["inv-004","room-005","ten-004","mtr-004",3,2026,5500,180,640,500,"paid","2026-03-05","2026-03-20","2026-03-17","INV-202603-004"],
  ["inv-005","room-007","ten-005","mtr-005",3,2026,3800,216,640,500,"paid","2026-03-05","2026-03-20","2026-03-20","INV-202603-005"],
  ["inv-006","room-008","ten-006","mtr-006",3,2026,3800,252,880,500,"paid","2026-03-05","2026-03-20","2026-03-19","INV-202603-006"],
  ["inv-007","room-009","ten-007","mtr-007",3,2026,4200,162,560,500,"paid","2026-03-05","2026-03-20","2026-03-14","INV-202603-007"],
  ["inv-008","room-011","ten-008","mtr-008",3,2026,4500,144,560,500,"paid","2026-03-05","2026-03-20","2026-03-16","INV-202603-008"],
  ["inv-009","room-001","ten-001","mtr-009",4,2026,4500,306,1040,500,"paid","2026-04-05","2026-04-20","2026-04-18","INV-202604-001"],
  ["inv-010","room-002","ten-002","mtr-010",4,2026,4500,270,880,500,"paid","2026-04-05","2026-04-20","2026-04-19","INV-202604-002"],
  ["inv-011","room-003","ten-003","mtr-011",4,2026,5000,252,840,500,"paid","2026-04-05","2026-04-20","2026-04-15","INV-202604-003"],
  ["inv-012","room-005","ten-004","mtr-012",4,2026,5500,216,720,500,"overdue","2026-04-05","2026-04-20",null,"INV-202604-004"],
  ["inv-013","room-007","ten-005","mtr-013",4,2026,3800,252,800,500,"paid","2026-04-05","2026-04-20","2026-04-20","INV-202604-005"],
  ["inv-014","room-008","ten-006","mtr-014",4,2026,3800,288,960,500,"pending","2026-04-05","2026-04-20",null,"INV-202604-006"],
  ["inv-015","room-009","ten-007","mtr-015",4,2026,4200,198,640,500,"pending","2026-04-05","2026-04-20",null,"INV-202604-007"],
  ["inv-016","room-011","ten-008","mtr-016",4,2026,4500,180,640,500,"pending","2026-04-05","2026-04-20",null,"INV-202604-008"],
  ["inv-017","room-001","ten-001","mtr-017",5,2026,4500,324,1120,500,"pending","2026-05-05","2026-05-20",null,"INV-202605-001"],
  ["inv-018","room-002","ten-002","mtr-018",5,2026,4500,270,960,500,"pending","2026-05-05","2026-05-20",null,"INV-202605-002"],
  ["inv-019","room-003","ten-003","mtr-019",5,2026,5000,252,920,500,"pending","2026-05-05","2026-05-20",null,"INV-202605-003"],
  ["inv-020","room-005","ten-004","mtr-020",5,2026,5500,198,800,500,"pending","2026-05-05","2026-05-20",null,"INV-202605-004"],
  ["inv-021","room-007","ten-005","mtr-021",5,2026,3800,252,880,500,"pending","2026-05-05","2026-05-20",null,"INV-202605-005"],
  ["inv-022","room-008","ten-006","mtr-022",5,2026,3800,324,1040,500,"pending","2026-05-05","2026-05-20",null,"INV-202605-006"],
  ["inv-023","room-009","ten-007","mtr-023",5,2026,4200,216,720,500,"pending","2026-05-05","2026-05-20",null,"INV-202605-007"],
  ["inv-024","room-011","ten-008","mtr-024",5,2026,4500,198,720,500,"pending","2026-05-05","2026-05-20",null,"INV-202605-008"],
];
for (const inv of invs) {
  const [id,rid,tid,mid,m,y,rent,water,elec,svc,status,issued,due,paid,invNo] = inv;
  if (paid) {
    await client.query(`INSERT INTO invoices (id, room_id, tenant_id, meter_reading_id, month, year, rental_cost, water_cost, electric_cost, service_charge, status, issued_date, due_date, paid_date, invoice_number) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::date,$13::date,$14::date,$15) ON CONFLICT DO NOTHING`, inv);
  } else {
    await client.query(`INSERT INTO invoices (id, room_id, tenant_id, meter_reading_id, month, year, rental_cost, water_cost, electric_cost, service_charge, status, issued_date, due_date, invoice_number) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::date,$13::date,$14) ON CONFLICT DO NOTHING`, [id,rid,tid,mid,m,y,rent,water,elec,svc,status,issued,due,invNo]);
  }
}
console.log("✓ " + invs.length + " invoices");

// ─── Activities ───
const acts = [
  ["act-001","meter","บันทึกมิเตอร์","A101 · น้ำ 18 หน่วย · ไฟ 140 kWh","2026-05-17T23:00:00Z"],
  ["act-002","invoice","ออกใบแจ้งหนี้","A102 · 1,730 ฿","2026-05-17T22:30:00Z"],
  ["act-003","tenant","เพิ่มผู้เช่า","B201 · น้องหญิง พิมพา","2026-05-17T12:00:00Z"],
  ["act-004","meter","บันทึกมิเตอร์","A201 · น้ำ 14 หน่วย · ไฟ 115 kWh","2026-05-17T09:00:00Z"],
  ["act-005","invoice","ชำระเงิน","A301 · 1,436 ฿","2026-05-17T06:00:00Z"],
  ["act-006","room","เปลี่ยนสถานะ","A302 · ซ่อมบำรุง → ว่าง","2026-05-17T04:00:00Z"],
  ["act-007","meter","บันทึกมิเตอร์","B101 · น้ำ 14 หน่วย · ไฟ 110 kWh","2026-05-16T00:00:00Z"],
  ["act-008","invoice","ออกใบแจ้งหนี้","B102 · 1,864 ฿","2026-05-15T20:00:00Z"],
];
for (const a of acts) {
  await client.query(`INSERT INTO activities (id, type, action, detail, created_at) VALUES ($1,$2,$3,$4,$5::timestamp) ON CONFLICT DO NOTHING`, a);
}
console.log("✓ " + acts.length + " activities");

console.log("\n✅ Seed complete! All data loaded.");
await client.end();
