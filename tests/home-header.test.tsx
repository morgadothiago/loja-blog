// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }), usePathname: () => "/" }));
const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));
vi.mock("@/lib/i18n-server", async () => {
  const { dictionaries } = await import("@/lib/i18n");
  return { getT: async () => ({ locale: "pt-BR", t: (k: keyof (typeof dictionaries)["pt-BR"]) => dictionaries["pt-BR"][k] }) };
});

import { AppHeader } from "@/components/header/app-header";
import { HomeHeader } from "@/components/home/home-header";
import { CartProvider } from "@/contexts/cart-context";
import { LanguageProvider } from "@/contexts/language-context";
import { dictionaries } from "@/lib/i18n";
import { getAuthCta } from "@/lib/auth-cta";

const labels = { openMenu: "Abrir menu", closeMenu: "Fechar menu", menuTitle: "Menu", nav: "Nav" };

async function renderHome(session: unknown) {
  authMock.mockResolvedValue(session);
  render(
    <LanguageProvider initialLocale="pt-BR">
      <CartProvider>{await HomeHeader()}</CartProvider>
    </LanguageProvider>,
  );
  // A home usa hambúrguer + overlay em todas as larguras: o CTA de sessão vive no menu.
  await userEvent.setup().click(screen.getByRole("button", { name: "Abrir menu" }));
  await screen.findByRole("dialog");
}

beforeEach(() => authMock.mockReset());

describe("getAuthCta", () => {
  const t = (k: keyof (typeof dictionaries)["pt-BR"]) => dictionaries["pt-BR"][k];
  it("deslogado -> Entrar (/login); admin -> dashboard; cliente -> /conta", () => {
    expect(getAuthCta(undefined, false, t)).toEqual({ href: "/login", label: "Entrar", icon: "login" });
    expect(getAuthCta("ADMIN", true, t)).toEqual({ href: "/dashboard", label: "Ir para o dashboard", icon: "dashboard" });
    expect(getAuthCta("CUSTOMER", true, t)).toEqual({ href: "/conta", label: "Minha conta", icon: "account" });
  });
  it("traduz nos 3 idiomas", () => {
    for (const l of ["pt-BR", "en", "es"] as const) {
      expect(getAuthCta("ADMIN", true, (k) => dictionaries[l][k]).label).toBe(dictionaries[l]["nav.goDashboard"]);
    }
    expect(dictionaries.en["nav.goDashboard"]).toBe("Go to dashboard");
    expect(dictionaries.es["nav.goDashboard"]).toBe("Ir al panel");
  });
});

describe("AppHeader cta", () => {
  it("sem cta não renderiza botão de sessão", () => {
    render(<AppHeader brand="X" items={[]} labels={labels} />);
    expect(screen.queryByRole("link", { name: /Entrar|dashboard/ })).toBeNull();
  });

  it("com cta mostra o link no desktop e dentro do menu", async () => {
    const user = userEvent.setup();
    render(<AppHeader brand="X" items={[]} cta={{ href: "/login", label: "Entrar", icon: <svg data-testid="ic" aria-hidden="true" /> }} labels={labels} />);
    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login");
    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    const dialog = await screen.findByRole("dialog");
    const inMenu = within(dialog).getByRole("link", { name: "Entrar" });
    expect(inMenu).toHaveAttribute("href", "/login");
    expect(within(inMenu).getByTestId("ic")).toBeInTheDocument();
    // o CTA é botão em destaque, não item de lista
    expect(inMenu.closest("li")).toBeNull();
  });
});

describe("HomeHeader (sessão no servidor)", () => {
  it("deslogado: Entrar -> /login, sem dashboard", async () => {
    await renderHome(null);
    const link = screen.getByRole("link", { name: "Entrar" });
    expect(link).toHaveAttribute("href", "/login");
    expect(link.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(link.querySelector(".lucide-log-in")).not.toBeNull();
    expect(screen.queryByRole("link", { name: "Ir para o dashboard" })).toBeNull();
  });

  it("admin logado: Ir para o dashboard -> /dashboard, sem Entrar", async () => {
    await renderHome({ user: { id: "1", role: "ADMIN" } });
    const link = screen.getByRole("link", { name: "Ir para o dashboard" });
    expect(link).toHaveAttribute("href", "/dashboard");
    expect(link.querySelector("svg[aria-hidden='true'].lucide-layout-dashboard")).not.toBeNull();
    expect(screen.queryByRole("link", { name: "Entrar" })).toBeNull();
  });

  it("cliente logado: Minha conta -> /conta (cliente não acessa /dashboard)", async () => {
    await renderHome({ user: { id: "2", role: "CUSTOMER" } });
    expect(screen.getByRole("link", { name: "Minha conta" })).toHaveAttribute("href", "/conta");
    expect(screen.queryByRole("link", { name: "Entrar" })).toBeNull();
  });
});
