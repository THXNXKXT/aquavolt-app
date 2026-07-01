// ───── Building ─────
export interface Building {
  id: string;
  name: string;
  address: string;
  totalRooms: number;
  createdAt: string;
  updatedAt: string;
}

// ───── Room Status ─────
export type RoomStatus = 'vacant' | 'occupied' | 'maintenance';

// ───── Room ─────
export interface Room {
  id: string;
  buildingId: string;
  roomNumber: string;
  floor: number;
  status: RoomStatus;
  buildingName?: string;
  currentTenantName?: string;
  rentalFee: number;       // ค่าห้องพักต่อเดือน
  createdAt: string;
  updatedAt: string;
}

// ───── Tenant ─────
export interface Tenant {
  id: string;
  roomId: string;
  name: string;
  phone: string;
  lineId?: string;
  moveInDate: string;
  moveOutDate?: string;
  contractDuration: number;  // 6, 12, 24 months
  isActive: boolean;
  wifiEnabled?: boolean;
  roomNumber?: string;
  buildingName?: string;
  createdAt: string;
  updatedAt: string;
}

// Money crosses the DB boundary as a numeric string; forms/calculators use numbers.
export type Money = number | string;

// ───── Meter Reading ─────
// DB stores meter values as numeric (precision 10,2) → drizzle returns strings.
// Keep them as strings on the client so we never silently round money.
export interface MeterReading {
  id: string;
  roomId: string;
  month: number;
  year: number;
  waterPrevious: string;
  waterCurrent: string;
  electricPrevious: string;
  electricCurrent: string;
  waterUsage: string;
  electricUsage: string;
  notes?: string;
  recordedAt: string;
  roomNumber?: string;
  buildingName?: string;
  createdAt: string;
  updatedAt: string;
}

// ───── Invoice Status ─────
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

// ───── Invoice ─────
export interface Invoice {
  id: string;
  roomId: string;
  tenantId: string;
  meterReadingId: string | null;
  month: number;
  year: number;
  rentalCost: string;      // ค่าห้องพัก — numeric column, client holds string
  waterCost: string;
  electricCost: string;
  serviceCharge: string;
  wifiCost: string | null;
  totalAmount: string;     // computed by the API from sumInvoice
  status: InvoiceStatus;
  issuedDate: string;
  dueDate: string;
  paidDate: string | null;
  invoiceNumber: string;
  roomNumber: string | null;
  tenantName: string | null;
  buildingName: string | null;
  createdAt: string;
  updatedAt: string;
}

// ───── Utility Rate ─────
export interface UtilityRate {
  id: string;
  name: string;
  unit: string;
  ratePerUnit: string;     // numeric column → string
  isActive: boolean;
  effectiveFrom: string;
  createdAt: string;
  updatedAt: string;
}

// ───── Form State ─────
export interface FormState<T> {
  isOpen: boolean;
  mode: 'create' | 'edit';
  data?: T;
}

// ───── Filter State ─────
export interface FilterState {
  buildingId?: string;
  status?: string;
  month?: number;
  year?: number;
  search?: string;
}
