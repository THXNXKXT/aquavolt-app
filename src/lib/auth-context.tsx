"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSession, signIn, signOut } from "@/lib/auth-client";

export interface AuthUser {
  name: string;
  email: string;
  image?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  const user = session?.user
    ? { name: session.user.name, email: session.user.email, image: session.user.image }
    : null;

  const login = async (email: string, password: string) => {
    const result = await signIn.email({ email, password });
    return !result.error;
  };

  const logout = async () => {
    await signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: isPending,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
