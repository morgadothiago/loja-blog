import { auth } from "@/auth";
import { AppHeader } from "@/components/header/app-header";
import { AuthCtaIconView } from "@/components/auth-cta-icon";
import { CartLink } from "@/components/home/cart-link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getAuthCta } from "@/lib/auth-cta";
import { getT } from "@/lib/i18n-server";
import { MENU_CLOSE_IMAGE, MENU_ITEMS } from "@/lib/nav";
import { SITE } from "@/lib/site";

// Server Component: a sessão é decidida no servidor (sem flash após hidratação)
// e entra no AppHeader (puro) como props.
export async function HomeHeader() {
  const [session, { t, locale }] = await Promise.all([auth(), getT()]);
  const cta = getAuthCta(session?.user?.role, !!session?.user, t);

  return (
    <AppHeader
      brand={SITE.name}
      overlayOnly
      closeImage={MENU_CLOSE_IMAGE}
      items={MENU_ITEMS.map((item) => ({
        href: item.href,
        label: t(item.altKey),
        image: item.images[locale],
        lines: item.lines,
      }))}
      sticky
      solidAfterId="home-hero"
      cta={{ href: cta.href, label: cta.label, icon: <AuthCtaIconView name={cta.icon} /> }}
      labels={{ openMenu: t("menu.open"), closeMenu: t("menu.close"), menuTitle: t("menu.title"), nav: t("nav.main") }}
      actions={<CartLink label={t("nav.cart")} />}
      desktopActions={<LanguageSwitcher className="h-11" />}
      // Cabeçalho do painel: [Idioma] [Carrinho] lado a lado (o X vem depois, no AppHeader).
      menuHeaderActions={
        <>
          <LanguageSwitcher compact className="h-11" />
          <CartLink label={t("nav.cart")} variant="pill" />
        </>
      }
    />
  );
}
