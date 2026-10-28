"use client";

import { createContext, useContext, useMemo } from "react";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import type { Session } from "next-auth";

type AuthContextValue = {
  user: Session["user"] | null;
  status: "loading" | "authenticated" | "unauthenticated";
  isAuthenticated: boolean;
  signIn: typeof signIn;
  signOut: typeof signOut;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthState({ children }: { children: React.ReactNode }) {
  const { data, status } = useSession();
  const value = useMemo<AuthContextValue>(
    () => ({
      user: data?.user ?? null,
      status,
      isAuthenticated: status === "authenticated",
      signIn,
      signOut,
    }),
    [data, status],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// A sessão inicial vem do servidor (auth()), evitando flash de "deslogado".
export function AuthProvider({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  return (
    <SessionProvider session={session}>
      <AuthState>{children}</AuthState>
    </SessionProvider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
