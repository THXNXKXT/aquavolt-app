const r = await fetch("http://localhost:3000/api/dashboard");
console.log("Status:", r.status);
const text = await r.text();
console.log("Response (first 500 chars):", text.substring(0, 500));
