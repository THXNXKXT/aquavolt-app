import { NextRequest } from "next/server";
import puppeteer from "puppeteer-core";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

  const fs = await import("fs");
  const exe = CHROME_PATHS.find((p) => { try { fs.accessSync(p); return true; } catch { return false; } });
  if (!exe) return new Response("Browser not found", { status: 500 });

  const browser = await puppeteer.launch({
    executablePath: exe,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(`http://localhost:3000/en/invoices/${id}`, {
      waitUntil: "networkidle0",
      timeout: 20000,
    });

    // Strip everything except .print-only — this isolates the print template
    // so page.pdf() renders ONLY the invoice, not the screen UI.
    await page.evaluate(() => {
      const printArea = document.querySelector(".print-only");
      if (!printArea) return;
      // Remove all siblings and ancestors' other children
      document.body.innerHTML = "";
      document.body.appendChild(printArea);
      // Force display block (print-only is display:none on screen)
      (printArea as HTMLElement).style.display = "block";
      // Reset any global styles that interfere
      document.body.style.margin = "0";
      document.body.style.padding = "0";
      document.body.style.background = "white";
    });

    await page.emulateMediaType("print");
    await new Promise((r) => setTimeout(r, 500));

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
    });

    await browser.close();

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${id}.pdf"`,
      },
    });
  } catch {
    await browser.close();
    return new Response("PDF generation failed", { status: 500 });
  }
}
