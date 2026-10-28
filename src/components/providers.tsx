"use client";

import type { Session } from "next-auth";
import { FlashToast } from "@/components/flash-toast";
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
          {/* Único Toaster do app (layout raiz: vale para (auth), (home), (private) e (public)).
              theme="light": a marca é clara e não há ThemeProvider; sem isso o toast seguiria o
              tema do sistema e ficaria escuro sobre o bege. sonner já anuncia via aria-live. */}
          <Toaster theme="light" position="top-center" />
          <FlashToast />
        </CartProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
