import type { MessageKey } from "@/lib/i18n";

// Regra única do botão de sessão no header. O dashboard é só de ADMIN
// (auth.config.ts redireciona cliente de /dashboard para /conta), então
// cliente logado aponta direto para /conta.
export type AuthCtaIcon = "login" | "dashboard" | "account";

// Itens do dropdown do usuário logado: ADMIN (dono do site) vai ao dashboard; cliente à conta e aos pedidos.
// "Sair" não entra aqui: é uma ação (logout), não um link.
export type UserMenuIcon = AuthCtaIcon | "orders";
export type UserMenuItem = { href: string; label: string; icon: UserMenuIcon };

export function getUserMenuItems(role: string | null | undefined, t: (key: MessageKey) => string): UserMenuItem[] {
  if (role === "ADMIN") return [{ href: "/dashboard", label: t("nav.goDashboard"), icon: "dashboard" }];
  return [
    { href: "/conta", label: t("nav.account"), icon: "account" },
    { href: "/conta/pedidos", label: t("nav.myOrders"), icon: "orders" },
  ];
}

export function getAuthCta(role: string | null | undefined, loggedIn: boolean, t: (key: MessageKey) => string) {
  if (!loggedIn) return { href: "/login", label: t("nav.login"), icon: "login" as AuthCtaIcon };
  if (role === "ADMIN") return { href: "/dashboard", label: t("nav.goDashboard"), icon: "dashboard" as AuthCtaIcon };
  return { href: "/conta", label: t("nav.account"), icon: "account" as AuthCtaIcon };
}
