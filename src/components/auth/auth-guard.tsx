"use client";

import { usePathname, useRouter } from "@/i18n/routing";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

const PUBLIC_ROUTES = ["/login"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.endsWith(r));

  useEffect(() => {
    // Auth state is already determined by useState sync (loadUser from localStorage)
    // No need for loading state since it's sync
    if (isPublic) {
      setChecked(true);
      return;
    }
    if (!isAuthenticated) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [isAuthenticated, pathname, router, isPublic]);

  // For public routes, always render
  if (isPublic) return <>{children}</>;

  // For protected routes, show nothing while checking
  if (!checked) return null;

  // Only render children when authenticated
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
