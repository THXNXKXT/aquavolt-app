import tls from "tls";
import https from "https";

console.log("Node version:", process.version);
console.log("Root CAs loaded:", tls.rootCertificates?.length ?? "N/A");

// Try connecting to Neon's database host via HTTPS
const host = "ep-ancient-union-aofrlvoj-pooler.c-2.ap-southeast-1.aws.neon.tech";

console.log("\nAttempting TLS connection to:", host);
const socket = tls.connect(443, host, { rejectUnauthorized: false }, () => {
  console.log("TLS connected!");
  console.log("Cipher:", socket.getCipher());
  console.log("Protocol:", socket.getProtocol());
  console.log("Server cert subject:", socket.getPeerCertificate()?.subject);
  socket.end();
});
socket.on("error", (e) => {
  console.log("TLS error:", e.message);
  console.log("Code:", e.code);
});
socket.setTimeout(10000, () => {
  console.log("Timeout after 10s");
  socket.destroy();
});

// Also try fetching via https
console.log("\nAttempting HTTPS connection...");
try {
  const r = await fetch(`https://${host}/`);
  console.log("HTTPS status:", r.status);
} catch (e) {
  console.log("HTTPS error:", e.message);
}
