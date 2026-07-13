"use client";

import { motion } from "framer-motion";
import { usePathname } from "@/i18n/routing";
import { GlobalNav } from "./global-nav";

export function NavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname.endsWith("/login");

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalNav />
      {/*
        Route transition: wipe-in from left, keyed on pathname.

        The new screen slides in from the left with a gentle fade — a tactile,
        directional motion that reads as "arriving." No exit animation, so no
        dark gap ("กระพริบ" from mode="wait") and no two-page overlap
        ("กระโดด/ขยาย" from cross-fading pages of very different height).

        - x:-20px → 0 + opacity 0 → 1, 0.6s easeOutExpo.
        - Reduced-motion kills it via the global media query.

        min-h-[80vh]: stable floor so the viewport doesn't collapse on a short
        page — keeps the footer from snapping up.
      */}
      <main className="flex-1 min-h-[80vh] pt-14">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
