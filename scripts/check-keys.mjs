import fs from "fs";
const en = fs.readFileSync("messages/en.json", "utf8");
const th = fs.readFileSync("messages/th.json", "utf8");
const keys = ["tenantsTotal", "systemSettings", "createBill", "allBuildings", "unitKwh", "unitM3", "topUsage", "electric", "water", "noRoomData", "readMeter", "issueBill"];
console.log("=== EN ===");
keys.forEach(k => console.log(k + ":", en.includes('"' + k + '"')));
console.log("=== TH ===");
keys.forEach(k => console.log(k + ":", th.includes('"' + k + '"')));
