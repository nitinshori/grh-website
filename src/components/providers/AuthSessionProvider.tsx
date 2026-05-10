"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/**
 * Client-side wrapper that exposes NextAuth session via React context so
 * the marketing Header (and any other client component) can know whether
 * the visitor is logged in and show "Sign out" instead of "Sign in".
 */
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
