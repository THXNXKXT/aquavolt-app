/**
 * API client — typed wrappers over the REST routes.
 */

import type {
  Building,
  Room,
  Tenant,
  Invoice,
  MeterReading,
  UtilityRate,
  InvoiceStatus,
} from "@/types";

const BASE = ""; // same origin

// ponytail: module-level SWR cache. GET responses are cached so revisiting
// a page renders instantly with stale data while a background refetch updates.
// Any mutation (POST/PATCH/DELETE) clears the whole cache — ~5 entries, free.
const cache = new Map<string, unknown>();

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const method = options?.method ?? "GET";
  const isGet = method === "GET";

  // Invalidate cache on any mutation
  if (!isGet) cache.clear();

  // Return cached data instantly, refetch in background
  if (isGet && cache.has(url)) {
    const cached = cache.get(url) as T;
    fetch(`${BASE}${url}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
    }).then(res => res.ok ? res.json() : null)
      .then(data => { if (data) cache.set(url, data); })
      .catch(() => {});
    return cached;
  }

  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Session expired");
  }
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (isGet) cache.set(url, data);
  return data as T;
}

// ─── Buildings ───
export const fetchBuildings = () => request<Building[]>("/api/buildings");
export const createBuilding = (data: { name: string; address?: string }) =>
  request<Building>("/api/buildings", { method: "POST", body: JSON.stringify(data) });
export const updateBuilding = (id: string, data: Partial<Pick<Building, "name" | "address">>) =>
  request<Building>(`/api/buildings/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteBuilding = (id: string) =>
  request<{ success: boolean }>(`/api/buildings/${id}`, { method: "DELETE" });

// ─── Rooms ───
export const fetchRooms = () => request<Room[]>("/api/rooms");
export const fetchRoom = (id: string) => request<Room>(`/api/rooms/${id}`);
export const createRoom = (data: {
  buildingId: string;
  roomNumber: string;
  floor?: number;
  status?: Room["status"];
  rentalFee?: number;
}) => request<Room>("/api/rooms", { method: "POST", body: JSON.stringify(data) });
export const updateRoom = (id: string, data: Partial<Omit<Room, "id" | "createdAt" | "updatedAt">>) =>
  request<Room>(`/api/rooms/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteRoom = (id: string) =>
  request<{ success: boolean }>(`/api/rooms/${id}`, { method: "DELETE" });

// ─── Tenants ───
export const fetchTenants = () => request<Tenant[]>("/api/tenants");
export const createTenant = (data: {
  roomId: string;
  name: string;
  phone: string;
  lineId?: string;
  moveInDate: string;
  moveOutDate?: string | null;
  contractDuration?: number;
  isActive?: boolean;
  wifiEnabled?: boolean;
}) => request<Tenant>("/api/tenants", { method: "POST", body: JSON.stringify(data) });
export const updateTenant = (id: string, data: Partial<Omit<Tenant, "id" | "createdAt" | "updatedAt">>) =>
  request<Tenant>(`/api/tenants/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteTenant = (id: string) =>
  request<{ success: boolean }>(`/api/tenants/${id}`, { method: "DELETE" });

// ─── Rates ───
export const fetchRates = () => request<UtilityRate[]>("/api/rates");
export const createRate = (data: { name: string; unit: string; ratePerUnit: number; isActive?: boolean }) =>
  request<UtilityRate>("/api/rates", { method: "POST", body: JSON.stringify(data) });
export const updateRate = (id: string, data: Partial<{ name: string; unit: string; ratePerUnit: number; isActive: boolean }>) =>
  request<UtilityRate>(`/api/rates/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteRate = (id: string) =>
  request<{ success: boolean }>(`/api/rates/${id}`, { method: "DELETE" });

// ─── Meters ───
export const fetchMeters = (params?: { roomId?: string; month?: number; year?: number }) => {
  const q = new URLSearchParams();
  if (params?.roomId) q.set("roomId", params.roomId);
  if (params?.month) q.set("month", String(params.month));
  if (params?.year) q.set("year", String(params.year));
  const qs = q.toString();
  return request<MeterReading[]>(`/api/meters${qs ? `?${qs}` : ""}`);
};
export const createMeterReading = (data: {
  roomId: string;
  month: number;
  year: number;
  waterPrevious?: number;
  waterCurrent?: number;
  electricPrevious?: number;
  electricCurrent?: number;
  notes?: string;
}) => request<MeterReading>("/api/meters", { method: "POST", body: JSON.stringify(data) });

// ─── Invoices ───
export const fetchInvoices = (params?: { month?: number; year?: number; status?: InvoiceStatus }) => {
  const q = new URLSearchParams();
  if (params?.month) q.set("month", String(params.month));
  if (params?.year) q.set("year", String(params.year));
  if (params?.status) q.set("status", params.status);
  const qs = q.toString();
  return request<Invoice[]>(`/api/invoices${qs ? `?${qs}` : ""}`);
};
export const fetchInvoice = (id: string) => request<Invoice>(`/api/invoices/${id}`);
export const createInvoice = (data: {
  roomId: string;
  tenantId: string;
  meterReadingId?: string | null;
  month: number;
  year: number;
  rentalCost: number;
  waterCost: number;
  electricCost: number;
  serviceCharge: number;
  wifiCost?: number;
  dueDate: string;
}) => request<Invoice>("/api/invoices", { method: "POST", body: JSON.stringify(data) });
export const updateInvoice = (
  id: string,
  data: { status?: InvoiceStatus; paidDate?: string | null; dueDate?: string },
) => request<Invoice>(`/api/invoices/${id}`, { method: "PATCH", body: JSON.stringify(data) });

// ─── Dashboard ───
export interface DashboardData {
  totalBuildings: number;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  maintenanceRooms: number;
  totalTenants: number;
  monthlyRevenue: number;
  pendingPayments: number;
  paidCount: number;
  pendingCount: number;
  currentInvoiceCount: number;
  collectionRate: number;
  revenueByMonth: { month: number; year: number; total: number }[];
  meterReadCount: number;
  meterUnreadCount: number;
  recentActivity: Array<{
    id: string;
    type: "meter" | "invoice" | "tenant" | "room";
    action: string;
    detail: string;
    createdAt: string;
  }>;
}
export const fetchDashboard = () => request<DashboardData>("/api/dashboard");

// ─── Settings ───
export const fetchSettings = () => request<Record<string, string>>("/api/settings");
export const updateSettings = (data: Record<string, string>) =>
  request<Record<string, string>>("/api/settings", { method: "PATCH", body: JSON.stringify(data) });

// ─── Activities ───
export interface Activity {
  id: string;
  type: "meter" | "invoice" | "tenant" | "room";
  action: string;
  detail: string;
  createdAt: string;
}
export const fetchActivities = (params?: { type?: Activity["type"]; limit?: number }) => {
  const q = new URLSearchParams();
  if (params?.type) q.set("type", params.type);
  if (params?.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return request<Activity[]>(`/api/activities${qs ? `?${qs}` : ""}`);
};
export const createActivity = (data: {
  type: Activity["type"];
  action: string;
  detail?: string;
}) => request<Activity>("/api/activities", { method: "POST", body: JSON.stringify(data) });
