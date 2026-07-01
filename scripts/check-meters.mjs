import fs from "fs";
const en = fs.readFileSync("messages/en.json", "utf8");
const th = fs.readFileSync("messages/th.json", "utf8");

const checks = ["recordMeter", "water", "electric", "meter.title", "noReadings", "calculatedCost", "selectRoom", "month", "year", "waterPrevious", "waterCurrent", "electricPrevious", "electricCurrent", "waterUsage", "electricUsage", "totalCost", "baht", "unit", "room", "rentalCost"];

console.log("=== Missing from en.json ===");
checks.forEach(k => { if (!en.includes('"' + k + '"')) console.log("  " + k); });

console.log("\n=== Missing from th.json ===");
checks.forEach(k => { if (!th.includes('"' + k + '"')) console.log("  " + k); });
