import { db } from "./index";
import { buildings } from "./schema/buildings";
import { rooms } from "./schema/rooms";
import { tenants } from "./schema/tenants";
import { utilityRates } from "./schema/utility-rates";
import { meterReadings } from "./schema/meter-readings";
import { invoices } from "./schema/invoices";
import { settings } from "./schema/settings";
import { mockBuildings } from "@/data/fixtures/buildings";
import { mockRooms } from "@/data/fixtures/rooms";
import { mockTenants } from "@/data/fixtures/tenants";
import { mockRates } from "@/data/fixtures/rates";
import { mockMeterReadings } from "@/data/fixtures/meter-readings";
import { mockInvoices } from "@/data/fixtures/invoices";

async function seed() {
  console.log("Seeding database...");

  // Buildings
  for (const b of mockBuildings) {
    await db.insert(buildings).values({
      id: b.id,
      name: b.name,
      address: b.address,
    }).onConflictDoNothing();
  }
  console.log(`✓ ${mockBuildings.length} buildings`);

  // Rooms
  for (const r of mockRooms) {
    await db.insert(rooms).values({
      id: r.id,
      buildingId: r.buildingId,
      roomNumber: r.roomNumber,
      floor: r.floor ?? 1,
      status: r.status as "vacant" | "occupied" | "maintenance",
      rentalFee: r.rentalFee,
    }).onConflictDoNothing();
  }
  console.log(`✓ ${mockRooms.length} rooms`);

  // Tenants
  for (const t of mockTenants) {
    await db.insert(tenants).values({
      id: t.id,
      roomId: t.roomId,
      name: t.name,
      phone: t.phone,
      lineId: t.lineId ?? "",
      moveInDate: new Date(t.moveInDate),
      contractDuration: t.contractDuration,
      isActive: t.isActive,
    }).onConflictDoNothing();
  }
  console.log(`✓ ${mockTenants.length} tenants`);

  // Utility Rates
  for (const r of mockRates) {
    await db.insert(utilityRates).values({
      id: r.id,
      name: r.name,
      unit: r.unit,
      ratePerUnit: String(r.ratePerUnit),
      isActive: r.isActive,
    }).onConflictDoNothing();
  }
  console.log(`✓ ${mockRates.length} utility rates`);

  // Meter Readings
  for (const m of mockMeterReadings) {
    await db.insert(meterReadings).values({
      id: m.id,
      roomId: m.roomId,
      month: m.month,
      year: m.year,
      waterPrevious: String(m.waterPrevious),
      waterCurrent: String(m.waterCurrent),
      electricPrevious: String(m.electricPrevious),
      electricCurrent: String(m.electricCurrent),
    }).onConflictDoNothing();
  }
  console.log(`✓ ${mockMeterReadings.length} meter readings`);

  // Invoices
  for (const inv of mockInvoices) {
    await db.insert(invoices).values({
      id: inv.id,
      roomId: inv.roomId,
      tenantId: inv.tenantId,
      meterReadingId: inv.meterReadingId,
      month: inv.month,
      year: inv.year,
      rentalCost: String(inv.rentalCost),
      waterCost: String(inv.waterCost),
      electricCost: String(inv.electricCost),
      serviceCharge: String(inv.serviceCharge),
      status: inv.status as "pending" | "paid" | "overdue" | "cancelled",
      dueDate: new Date(inv.dueDate),
      paidDate: inv.paidDate ? new Date(inv.paidDate) : null,
      invoiceNumber: inv.invoiceNumber,
    }).onConflictDoNothing();
  }
  console.log(`✓ ${mockInvoices.length} invoices`);

  // Settings
  const defaultSettings = [
    { key: "dormitory_name", value: "AquaVolt Dormitory" },
    { key: "dormitory_address", value: "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110" },
    { key: "phone", value: "02-123-4567" },
    { key: "water_rate", value: "18" },
    { key: "electric_rate", value: "8" },
    { key: "service_charge", value: "500" },
    { key: "bank_name", value: "ธนาคารกสิกรไทย" },
    { key: "bank_account", value: "XXX-X-XXXXX-X" },
    { key: "account_name", value: "ชื่อบัญชีหอพัก" },
    { key: "promptpay_number", value: "XXX-XXX-XXXX" },
    { key: "wifi_rate", value: "300" },
  ];
  for (const s of defaultSettings) {
    await db.insert(settings).values({
      id: crypto.randomUUID(),
      key: s.key,
      value: s.value,
    }).onConflictDoNothing();
  }
  console.log(`✓ ${defaultSettings.length} settings`);

  console.log("\n✅ Seed complete!");
}

seed().catch(console.error);
