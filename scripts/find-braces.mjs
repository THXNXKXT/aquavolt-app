import fs from "fs";
const lines = fs.readFileSync("D:/Projects/aquavolt-app/src/app/[locale]/dashboard/page.tsx", "utf8").split("\n");
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(")}") && !lines[i].includes("})") && !lines[i].includes("()") && !lines[i].includes("\")")) {
    console.log("Line", i + 1, ":", lines[i].trim());
  }
}
