"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { AuthCtaIconView } from "@/components/auth-cta-icon";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { useI18n } from "@/contexts/language-context";
import { UserMenu } from "@/components/user-menu";
import { getAuthCta, getUserMenuItems } from "@/lib/auth-cta";
import { SITE } from "@/lib/site";

export function SiteHeader() {
  const { isAuthenticated, user } = useAuth();
  const { count } = useCart();
  const { t } = useI18n();
  const cta = getAuthCta(user?.role, isAuthenticated, t);

  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-5xl items-center gap-6 p-4 text-sm">
        <Link href="/" className="font-semibold">{SITE.name}</Link>
        <Link href="/loja">{t("nav.shop")}</Link>
        <Link href="/blog">{t("nav.blog")}</Link>
        <div className="ml-auto flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/carrinho" className="relative">
            {t("nav.cart")}
            {count > 0 && (
              <span className="bg-primary text-primary-foreground ml-1 rounded-full px-1.5 py-0.5 text-xs">
                {count}
              </span>
            )}
          </Link>
          {isAuthenticated ? (
            <UserMenu
              name={user?.name}
              email={user?.email}
              items={getUserMenuItems(user?.role, t)}
              labels={{ trigger: t("nav.userMenu"), logout: t("nav.logout") }}
            />
          ) : (
            <Link href={cta.href} className={buttonVariants({ size: "sm", variant: "outline" })}>
              <AuthCtaIconView name={cta.icon} className="size-3.5" />
              {cta.label}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
