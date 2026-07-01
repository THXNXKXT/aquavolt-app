import fs from "fs";

let en = fs.readFileSync("messages/en.json", "utf8");
en = en.replace('"noData"', '"items": "items",\n    "noData"');
fs.writeFileSync("messages/en.json", en);
console.log("Updated en.json");

let th = fs.readFileSync("messages/th.json", "utf8");
th = th.replace('"noData"', '"items": "รายการ",\n    "noData"');
fs.writeFileSync("messages/th.json", th);
console.log("Updated th.json");
