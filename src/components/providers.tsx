"use client";

import type { Session } from "next-auth";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { CartProvider } from "@/contexts/cart-context";
import { LanguageProvider } from "@/contexts/language-context";
import type { Locale } from "@/lib/i18n";

export function Providers({
  session,
  locale,
  children,
}: {
  session: Session | null;
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <AuthProvider session={session}>
      <LanguageProvider initialLocale={locale}>
        <CartProvider>
          {children}
          <Toaster />
        </CartProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
