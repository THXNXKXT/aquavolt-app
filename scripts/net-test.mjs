// Test network connectivity
try {
  const r = await fetch("https://neon.tech");
  console.log("neon.tech reachable:", r.status);
} catch (e) {
  console.log("neon.tech FAIL:", e.message);
}

try {
  const r2 = await fetch("https://google.com");
  console.log("google.com reachable:", r2.status);
} catch (e) {
  console.log("google.com FAIL:", e.message);
}
