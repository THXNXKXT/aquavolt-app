import { db } from "@/db";
import { buildings } from "@/db/schema/buildings";
import { rooms } from "@/db/schema/rooms";
import { tenants } from "@/db/schema/tenants";
import { invoices } from "@/db/schema/invoices";
import { meterReadings } from "@/db/schema/meter-readings";
import { and, count, eq, sql } from "drizzle-orm";
import { markOverdue, recentActivities } from "@/db/queries";
import { sumInvoice } from "@/lib/calculators";
import { route } from "@/lib/route-handler";

export const GET = route(async () => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // #10: promote stale pending invoices to overdue before we report on them.
  await markOverdue();

  // Single pass over room statuses instead of 4 count queries.
  const [bldgCount] = await db.select({ count: count() }).from(buildings);
  const roomStatus = await db
    .select({ status: rooms.status, count: count() })
    .from(rooms)
    .groupBy(rooms.status);

  const byStatus = (s: string) =>
    Number(roomStatus.find((r) => r.status === s)?.count ?? 0);
  const occupiedRooms = byStatus("occupied");
  const totalRooms = Number((await db.select({ count: count() }).from(rooms))[0]?.count ?? 0);

  const [tenantCount] = await db
    .select({ count: count() })
    .from(tenants)
    .where(eq(tenants.isActive, true));

  // Current-month invoices — one query, #4: sumInvoice now includes wifiCost.
  const currentInvoices = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.month, currentMonth), eq(invoices.year, currentYear)));

  const isUnpaid = (i: (typeof currentInvoices)[number]) =>
    i.status === "pending" || i.status === "overdue";

  const monthlyRevenue = currentInvoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + sumInvoice(i), 0);
  const pendingPayments = currentInvoices
    .filter(isUnpaid)
    .reduce((s, i) => s + sumInvoice(i), 0);
  const paidCount = currentInvoices.filter((i) => i.status === "paid").length;
  const pendingCount = currentInvoices.filter(isUnpaid).length;

  // #9: six-month revenue from a single query + a JS fold of sumInvoice,
  // instead of one query per month. Tuple compare on (year, month) is a clean
  // Postgres range check; we only pull the window we fold over.
  const startD = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const startY = startD.getFullYear();
  const startM = startD.getMonth() + 1;
  const monthlyRows = await db
    .select({
      month: invoices.month,
      year: invoices.year,
      invoice: invoices,
    })
    .from(invoices)
    .where(sql`(${invoices.year}, ${invoices.month}) >= (${startY}, ${startM})`);

  const revenueByMonth: { month: number; year: number; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const total = monthlyRows
      .filter((r) => r.month === m && r.year === y)
      .reduce((s, r) => s + sumInvoice(r.invoice), 0);
    revenueByMonth.push({ month: m, year: y, total });
  }

  // Meter-read status this month.
  const currentReadings = await db
    .select({ roomId: meterReadings.roomId })
    .from(meterReadings)
    .where(and(eq(meterReadings.month, currentMonth), eq(meterReadings.year, currentYear)));
  const readRoomIds = new Set(currentReadings.map((r) => r.roomId));

  const occupiedRoomIds = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(eq(rooms.status, "occupied"));
  const meterReadCount = occupiedRoomIds.filter((r) => readRoomIds.has(r.id)).length;
  const meterUnreadCount = occupiedRoomIds.length - meterReadCount;

  const recentActivity = await recentActivities(6);

  return Response.json({
    totalBuildings: Number(bldgCount?.count ?? 0),
    totalRooms,
    occupiedRooms,
    vacantRooms: byStatus("vacant"),
    maintenanceRooms: byStatus("maintenance"),
    totalTenants: Number(tenantCount?.count ?? 0),
    monthlyRevenue,
    pendingPayments,
    paidCount,
    pendingCount,
    currentInvoiceCount: currentInvoices.length,
    collectionRate:
      currentInvoices.length > 0
        ? Math.round((paidCount / currentInvoices.length) * 100)
        : 0,
    revenueByMonth,
    meterReadCount,
    meterUnreadCount,
    recentActivity,
  });
});
