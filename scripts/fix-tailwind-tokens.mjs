import fs from "fs";
import path from "path";

const files = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!e.name.startsWith("node_modules") && !e.name.startsWith(".next") && !e.name.startsWith("drizzle")) walk(p); }
    else if (e.name.endsWith(".tsx") || e.name.endsWith(".ts")) files.push(p);
  }
}
walk("D:/Projects/aquavolt-app/src");

// Only EXACT color matches from DESIGN.md tokens
const colorMap = {
  "#0066cc": "primary",
  "#0071e3": "primary-focus",
  "#2997ff": "primary-on-dark",
  "#1d1d1f": "ink",
  "#cccccc": "body-muted",
  "#333333": "ink-muted-80",
  "#7a7a7a": "ink-muted-48",
  "#f0f0f0": "divider-soft",
  "#e0e0e0": "hairline",
  "#f5f5f7": "canvas-parchment",
  "#fafafc": "surface-pearl",
  "#272729": "surface-tile-1",
  "#2a2a2c": "surface-tile-2",
  "#252527": "surface-tile-3",
  "#000000": "surface-black",
  "#d2d2d7": "surface-chip",
};

const radiusMap = { "5px": "xs", "8px": "sm", "11px": "md", "18px": "lg", "9999px": "pill" };

let totalFiles = 0;

for (const f of files) {
  let content = fs.readFileSync(f, "utf8");
  const orig = content;
  const rel = path.relative("D:/Projects/aquavolt-app", f);
  let changed = false;

  for (const [hex, token] of Object.entries(colorMap)) {
    const patterns = [
      [`bg-[${hex}]`, `bg-${token}`],
      [`text-[${hex}]`, `text-${token}`],
      [`border-[${hex}]`, `border-${token}`],
      [`hover:border-[${hex}]`, `hover:border-${token}`],
      [`hover:text-[${hex}]`, `hover:text-${token}`],
      [`hover:bg-[${hex}]`, `hover:bg-${token}`],
      [`group-hover:bg-[${hex}]`, `group-hover:bg-${token}`],
      [`group-hover:text-[${hex}]`, `group-hover:text-${token}`],
    ];
    for (const [from, to] of patterns) {
      if (content.includes(from)) {
        content = content.replaceAll(from, to);
        changed = true;
      }
    }
  }

  for (const [px, token] of Object.entries(radiusMap)) {
    if (content.includes(`rounded-[${px}]`)) {
      content = content.replaceAll(`rounded-[${px}]`, `rounded-${token}`);
      changed = true;
    }
  }

  if (content.includes("max-w-[1200px]")) {
    content = content.replaceAll("max-w-[1200px]", "max-w-300");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(f, content);
    totalFiles++;
    console.log("✓", rel);
  }
}
console.log(`\n✅ Updated ${totalFiles} files with design tokens`);
