const r = await fetch("http://localhost:3000/api/invoices");
const data = await r.json();
console.log("Total invoices:", data.length);
console.log("First invoice:", JSON.stringify(data[0], null, 2));
console.log("totalAmount type:", typeof data[0]?.totalAmount);
console.log("totalAmount value:", data[0]?.totalAmount);
