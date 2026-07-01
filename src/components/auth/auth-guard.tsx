"use client";

import { usePathname, useRouter } from "@/i18n/routing";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

const PUBLIC_ROUTES = ["/login"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.endsWith(r));

  useEffect(() => {
    if (isPublic || isLoading) return;
    if (!isAuthenticated && !redirecting) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRedirecting(true);
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, pathname, router, isPublic, redirecting]);

  // Always render public routes
  if (isPublic) return <>{children}</>;

  // Show nothing while session is loading or redirecting
  if (isLoading || (!isAuthenticated && redirecting)) return null;

  // Only render protected content when authenticated
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
