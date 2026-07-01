import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Same origin — Better-Auth handles /api/auth/* routes
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
});

export const {
  signIn,
  signOut,
  useSession,
  changePassword,
} = authClient;
