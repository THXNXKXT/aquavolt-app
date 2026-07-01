import { formatCurrency, formatNumber, getMonthName, timeAgo } from "@/lib/formatters";

describe("formatCurrency", () => {
  it("formats THB currency", () => {
    const result = formatCurrency(1234.5);
    expect(result).toContain("1,234");
    expect(result).toContain("฿");
  });

  it("handles zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });
});

describe("formatNumber", () => {
  it("adds comma separators", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });
});

describe("getMonthName", () => {
  it("returns Thai month name", () => {
    const name = getMonthName(1, "th");
    expect(name).toContain("มกรา");
  });

  it("returns English month name", () => {
    const name = getMonthName(1, "en");
    expect(name).toBe("January");
  });
});

describe("timeAgo", () => {
  it("returns minutes for recent timestamps", () => {
    const recent = new Date(Date.now() - 5 * 60000).toISOString(); // 5 min ago
    const result = timeAgo(recent, "en");
    expect(result).toMatch(/5 (min|นาที)/);
  });

  it("returns hours for older timestamps", () => {
    const old = new Date(Date.now() - 3 * 3600000).toISOString(); // 3 hr ago
    const result = timeAgo(old, "en");
    expect(result).toMatch(/3 (hr|ชั่วโมง)/);
  });

  it("returns days for very old timestamps", () => {
    const veryOld = new Date(Date.now() - 2 * 86400000).toISOString(); // 2 days ago
    const result = timeAgo(veryOld, "en");
    expect(result).toMatch(/2 (day|days|วัน)/);
  });
});
