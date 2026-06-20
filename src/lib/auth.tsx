"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useUser } from "@clerk/nextjs";

interface AuthContextType {
  isAdmin: boolean;
  isLoaded: boolean;
  userId: string | null;
}

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  isLoaded: false,
  userId: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, user } = useUser();

  const raw = user?.publicMetadata as Record<string, unknown> | undefined;
  const roles: string[] = Array.isArray(raw?.roles) ? raw.roles : [];
  const isAdmin = roles.includes("super_admin");

  return (
    <AuthContext.Provider value={{ isAdmin, isLoaded, userId: user?.id || null }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
