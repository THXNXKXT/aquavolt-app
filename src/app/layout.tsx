import type { Metadata } from "next";
import "./globals.css";
import { ClientLayout } from "@/components/shared/client-layout";

export const metadata: Metadata = {
  title: "AquaVolt — Dormitory Management",
  description: "Utility billing, tenant management, and financial reporting for dormitories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-canvas-parchment text-ink font-sans" suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
