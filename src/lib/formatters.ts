/**
 * Format a date string to a human-readable format
 */
export function formatDate(dateString: string, locale: string = 'th'): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a short date (dd/mm/yyyy)
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * Format currency in THB. Accepts a DB numeric string or a number, so callers
 * never have to remember which surface money lives on.
 */
export function formatCurrency(amount: import("@/types").Money): string {
  const n = typeof amount === "number" ? amount : parseFloat(amount ?? "0");
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

/**
 * Format a number with comma separators
 */
export function formatNumber(num: import("@/types").Money): string {
  const n = typeof num === "number" ? num : parseFloat(num ?? "0");
  return new Intl.NumberFormat('en-US').format(Number.isFinite(n) ? n : 0);
}

/**
 * Get month name in Thai or English
 */
export function getMonthName(month: number, locale: string = 'th'): string {
  const date = new Date(2000, month - 1, 1);
  return date.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { month: 'long' });
}

/**
 * Generate a unique ID (for mock data)
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * Get status color for badges
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    vacant: 'bg-blue-50 text-blue-700',
    occupied: 'bg-green-50 text-green-700',
    maintenance: 'bg-amber-50 text-amber-700',
    pending: 'bg-amber-50 text-amber-700',
    paid: 'bg-green-50 text-green-700',
    overdue: 'bg-red-50 text-red-700',
    cancelled: 'bg-zinc-50 text-zinc-500',
    active: 'bg-green-50 text-green-700',
    inactive: 'bg-zinc-50 text-zinc-500',
  };
  return colors[status] || 'bg-zinc-50 text-zinc-600';
}

/**
 * Calculate time ago string
 */
export function timeAgo(ts: string, locale: string = "th"): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) {
    return locale === "th" ? `${mins} นาที` : `${mins} min`;
  }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    return locale === "th" ? `${hrs} ชั่วโมง` : `${hrs} hr`;
  }
  const days = Math.floor(hrs / 24);
  return locale === "th" ? `${days} วัน` : `${days} day${days > 1 ? "s" : ""}`;
}

/** Milliseconds constants */
export const MS = {
  DAY: 86400000,
  HOUR: 3600000,
  MINUTE: 60000,
} as const;
