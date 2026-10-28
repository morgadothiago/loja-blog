import Image from "next/image";
import { auth } from "@/auth";
import logo from "@/assets/About/Elena_landinez.png";
import { AppHeader } from "@/components/header/app-header";
import { AuthCtaIconView } from "@/components/auth-cta-icon";
import { CartLink } from "@/components/home/cart-link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getAuthCta } from "@/lib/auth-cta";
import { getT } from "@/lib/i18n-server";
import { MENU_CLOSE_IMAGE, MENU_HAMBURGER_IMAGE, MENU_ITEMS } from "@/lib/nav";
import { SITE } from "@/lib/site";

// Server Component: a sessão é decidida no servidor (sem flash após hidratação)
// e entra no AppHeader (puro) como props.
export async function HomeHeader() {
  const [session, { t, locale }] = await Promise.all([auth(), getT()]);
  const cta = getAuthCta(session?.user?.role, !!session?.user, t);

  return (
    <AppHeader
      brand={
        // Logo manuscrito (Elena_landinez.png: 747x225, BRANCO sobre transparente). `brightness-0` o deixa preto
        // sobre o bege/claro do header. alt = nome configurável do site (SITE.name). A arte tem margem
        // transparente à esquerda (~17%): o -ml alinha as letras à margem de 20px.
        <Image src={logo} alt={SITE.name} priority className="-ml-7 h-12 w-auto brightness-0 md:h-14" />
      }
      overlayOnly
      closeImage={MENU_CLOSE_IMAGE}
      menuImage={MENU_HAMBURGER_IMAGE}
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
