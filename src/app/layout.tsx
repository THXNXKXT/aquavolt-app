import type { Metadata } from "next";
import "./globals.css";
import { ClientLayout } from "@/components/shared/client-layout";

export const metadata: Metadata = {
  title: "AquaVolt - ระบบจัดการหอพัก",
  description:
    "Dormitory utility management system for water and electricity billing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-canvas-parchment text-ink font-sans" suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
