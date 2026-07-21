import { NextRequest } from "next/server";
import puppeteer from "puppeteer-core";
import { db } from "@/db";
import { invoices } from "@/db/schema/invoices";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// ponytail: find Chrome on Windows — registry says C:\Program Files\Google\Chrome\Application
const CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!inv) return new Response("Not found", { status: 404 });

  const exe = CHROME_PATHS.find((p) => {
    try {
      require("fs").accessSync(p);
      return true;
    } catch {
      return false;
    }
  });
  if (!exe) return new Response("Chrome not found", { status: 500 });

  const browser = await puppeteer.launch({
    executablePath: exe,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  await page.goto(`http://localhost:3000/en/invoices/${id}`, {
    waitUntil: "networkidle0",
    timeout: 20000,
  });
  await page.emulateMediaType("print");
  await new Promise((r) => setTimeout(r, 500));

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await browser.close();

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${inv.invoiceNumber}.pdf"`,
    },
  });
}
