import fs from "fs";

let en = fs.readFileSync("messages/en.json", "utf8");
// Add perMonth and days in common section after "items"
en = en.replace('"items": "items"', '"items": "items",\n    "perMonth": "฿/month",\n    "days": "d"');
fs.writeFileSync("messages/en.json", en);
console.log("Updated en.json");

let th = fs.readFileSync("messages/th.json", "utf8");
// Add perMonth and days in common section after "items"
th = th.replace('"items": "รายการ"', '"items": "รายการ",\n    "perMonth": "฿/เดือน",\n    "days": "วัน"');
fs.writeFileSync("messages/th.json", th);
console.log("Updated th.json");
