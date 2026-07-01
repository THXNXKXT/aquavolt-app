import { calculateUtilityCosts, CalculationInput, CalculationResult } from "@/lib/calculators";

describe("calculateUtilityCosts", () => {
  const baseInput: CalculationInput = {
    waterPrevious: 100,
    waterCurrent: 110,
    electricPrevious: 500,
    electricCurrent: 580,
    waterRate: 18,
    electricRate: 8,
    serviceCharge: 500,
    rentalFee: 4500,
    wifiCost: 300,
  };

  it("calculates water usage correctly", () => {
    const result = calculateUtilityCosts(baseInput);
    expect(result.waterUsage).toBe(10); // 110 - 100
    expect(result.waterCost).toBe(180); // 10 × 18
  });

  it("calculates electric usage correctly", () => {
    const result = calculateUtilityCosts(baseInput);
    expect(result.electricUsage).toBe(80); // 580 - 500
    expect(result.electricCost).toBe(640); // 80 × 8
  });

  it("includes service charge and rental fee", () => {
    const result = calculateUtilityCosts(baseInput);
    expect(result.serviceCharge).toBe(500);
    expect(result.rentalCost).toBe(4500);
  });

  it("includes WiFi cost when provided", () => {
    const result = calculateUtilityCosts(baseInput);
    expect(result.wifiCost).toBe(300);
  });

  it("defaults WiFi to 0 when not provided", () => {
    const { wifiCost, ...inputWithoutWifi } = baseInput;
    const result = calculateUtilityCosts(inputWithoutWifi as CalculationInput);
    expect(result.wifiCost).toBe(0);
  });

  it("calculates total amount correctly", () => {
    const result = calculateUtilityCosts(baseInput);
    expect(result.totalAmount).toBe(180 + 640 + 500 + 4500 + 300); // 6120
  });

  it("returns 0 usage when current equals previous", () => {
    const result = calculateUtilityCosts({ ...baseInput, waterCurrent: 100 });
    expect(result.waterUsage).toBe(0);
    expect(result.waterCost).toBe(0);
  });

  it("handles zero values gracefully", () => {
    const input: CalculationInput = {
      waterPrevious: 0, waterCurrent: 0,
      electricPrevious: 0, electricCurrent: 0,
      waterRate: 0, electricRate: 0,
      serviceCharge: 0, rentalFee: 0,
    };
    const result = calculateUtilityCosts(input);
    expect(result.totalAmount).toBe(0);
  });
});
