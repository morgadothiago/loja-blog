// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const logoutMock = vi.fn();
vi.mock("@/actions/auth", () => ({ logout: (...args: unknown[]) => logoutMock(...args) }));

import { UserMenu, UserPanel } from "@/components/user-menu";
import { dictionaries } from "@/lib/i18n";
import { getUserMenuItems } from "@/lib/auth-cta";

const t = (k: keyof (typeof dictionaries)["pt-BR"]) => dictionaries["pt-BR"][k];
const labels = { trigger: "Menu do usuário", logout: "Sair" };

function menu(role: "ADMIN" | "CUSTOMER", extra: { name?: string | null; email?: string | null } = { name: "Elena", email: "elena@x.com" }) {
  render(<UserMenu {...extra} items={getUserMenuItems(role, t)} labels={labels} />);
  return userEvent.setup();
}

beforeEach(() => logoutMock.mockReset());

describe("getUserMenuItems", () => {
  it("ADMIN: só o dashboard", () => {
    expect(getUserMenuItems("ADMIN", t)).toEqual([{ href: "/dashboard", label: "Ir para o dashboard", icon: "dashboard" }]);
  });
  it("cliente: conta e pedidos (e nunca o dashboard)", () => {
    const items = getUserMenuItems("CUSTOMER", t);
    expect(items.map((i) => i.href)).toEqual(["/conta", "/conta/pedidos"]);
    expect(items.map((i) => i.href)).not.toContain("/dashboard");
  });
  it("sem papel conhecido cai no painel do cliente", () => {
    expect(getUserMenuItems(undefined, t).map((i) => i.href)).toEqual(["/conta", "/conta/pedidos"]);
  });
  it("tem tradução nos 3 idiomas", () => {
    for (const l of ["pt-BR", "en", "es"] as const) {
      for (const k of ["nav.userMenu", "nav.logout", "nav.myOrders"] as const) expect(dictionaries[l][k]).toBeTruthy();
    }
    expect(dictionaries.en["nav.logout"]).toBe("Sign out");
    expect(dictionaries.es["nav.logout"]).toBe("Cerrar sesión");
  });
});

describe("UserMenu", () => {
  it("gatilho só com ícone, sem fundo nem borda, com nome acessível", () => {
    menu("CUSTOMER");
    const btn = screen.getByRole("button", { name: "Menu do usuário: Elena" });
    expect(btn).toHaveAttribute("aria-haspopup", "menu");
    expect(btn.textContent).toBe("");
    const classes = btn.className.split(/\s+/);
    for (const c of ["bg-secondary", "border-ink/30"]) expect(classes).not.toContain(c);
  });

  it("sem nome o nome acessível é só o rótulo", () => {
    menu("CUSTOMER", {});
    expect(screen.getByRole("button", { name: "Menu do usuário" })).toBeInTheDocument();
  });

  it("cliente: mostra identidade, Minha conta, Meus pedidos e Sair", async () => {
    const user = menu("CUSTOMER");
    await user.click(screen.getByRole("button", { name: /Menu do usuário/ }));
    expect(await screen.findByText("elena@x.com")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Minha conta" })).toHaveAttribute("href", "/conta");
    expect(screen.getByRole("menuitem", { name: "Meus pedidos" })).toHaveAttribute("href", "/conta/pedidos");
    expect(screen.getByRole("menuitem", { name: "Sair" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /dashboard/i })).toBeNull();
  });

  it("ADMIN: mostra o dashboard e Sair, sem Minha conta", async () => {
    const user = menu("ADMIN");
    await user.click(screen.getByRole("button", { name: /Menu do usuário/ }));
    expect(await screen.findByRole("menuitem", { name: "Ir para o dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("menuitem", { name: "Sair" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Minha conta" })).toBeNull();
  });

  it("Sair chama a action de logout", async () => {
    const user = menu("CUSTOMER");
    await user.click(screen.getByRole("button", { name: /Menu do usuário/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Sair" }));
    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
  });

  it("abre por teclado e fecha com Esc devolvendo o foco ao gatilho", async () => {
    const user = menu("CUSTOMER");
    const btn = screen.getByRole("button", { name: /Menu do usuário/ });
    btn.focus();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("menuitem", { name: "Minha conta" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menuitem", { name: "Minha conta" })).toBeNull());
    expect(btn).toHaveFocus();
  });
});

describe("UserPanel (painel mobile)", () => {
  it("lista os links do papel, fecha ao navegar e tem botão Sair", async () => {
    const onNavigate = vi.fn();
    render(<UserPanel name="Elena" email="elena@x.com" items={getUserMenuItems("CUSTOMER", t)} labels={labels} onNavigate={onNavigate} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("link", { name: "Meus pedidos" }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Sair" }));
    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
  });
});
