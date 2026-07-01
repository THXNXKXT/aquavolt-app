import fs from "fs";

let en = fs.readFileSync("messages/en.json", "utf8");
en = en.replace('"noData": "No data available"', '"noData": "No data available",\n    "no_activity": "No activity"');
fs.writeFileSync("messages/en.json", en);

let th = fs.readFileSync("messages/th.json", "utf8");
th = th.replace('"noData": "ไม่มีข้อมูล"', '"noData": "ไม่มีข้อมูล",\n    "no_activity": "ไม่มีกิจกรรม"');
fs.writeFileSync("messages/th.json", th);
console.log("Done");
