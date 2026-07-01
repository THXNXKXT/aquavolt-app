import fs from "fs";
import path from "path";

const dir = "D:/Projects/aquavolt-app/src/app/api";
const files = [];

function walk(d) {
  const entries = fs.readdirSync(d, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === "route.ts") files.push(p);
  }
}
walk(dir);

let total = 0;
const patterns = [
  // Remove entire line: try { await requireAuth(); } catch { return unauthorized(); }
  [/  try \{ await requireAuth\(\); \} catch \{ return unauthorized\(\); \}\n/g, ""],
  // Remove import of requireAuth and unauthorized when notFound is also imported
  [/import \{ requireAuth, unauthorized, notFound \} from "@\/lib\/api-helper";/g, 'import { notFound } from "@/lib/api-helper";'],
  // Remove import of just requireAuth and unauthorized
  [/import \{ requireAuth, unauthorized \} from "@\/lib\/api-helper";/g, ''],
];

for (const f of files) {
  let content = fs.readFileSync(f, "utf8");
  const orig = content;

  for (const [pattern, replacement] of patterns) {
    content = content.replace(pattern, replacement);
  }

  // Clean up empty lines
  content = content.replace(/\n{3,}/g, "\n\n");

  if (content !== orig) {
    fs.writeFileSync(f, content);
    console.log("✓", path.relative(dir, f));
    total++;
  }
}
console.log(`\nUpdated ${total} files`);
