import fs from "fs";
const env = fs.readFileSync(".env", "utf8");
const match = env.match(/@([^\/]+)/);
if (match) {
  const host = match[1];
  console.log("Database host:", host);
  try {
    const r = await fetch(`https://${host}/`);
    console.log("Host reachable:", r.status);
  } catch (e) {
    console.log("Host FAIL:", e.message);
  }
}
