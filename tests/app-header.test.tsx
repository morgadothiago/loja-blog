// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const pathname = vi.hoisted(() => ({ value: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));
import { AppHeader } from "@/components/header/app-header";

const labels = { openMenu: "Abrir menu", closeMenu: "Fechar menu", menuTitle: "Menu", nav: "Navegação principal" };
const items = [
  { href: "/loja", label: "Loja" },
  { href: "/blog", label: "Blog" },
];

function setup() {
  render(
    <AppHeader brand="Meu Site" items={items} labels={labels} actions={<span>ação</span>} menuFooter={<p>rodapé do menu</p>} />,
  );
  return userEvent.setup();
}

describe("AppHeader (menu)", () => {
  it("topo do menu: título, slot de idioma e fechar, nessa ordem; itens em ordem; CTA em destaque", async () => {
    const user = userEvent.setup();
    pathname.value = "/blog";
    render(
      <AppHeader
        brand="X"
        items={items}
        cta={{ href: "/login", label: "Entrar" }}
        menuHeaderActions={<button type="button">Idioma</button>}
        labels={labels}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    const dialog = await screen.findByRole("dialog");
    const buttons = within(dialog).getAllByRole("button").map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(buttons).toEqual(["Idioma", "Fechar menu"]);
    expect(within(dialog).getByRole("heading", { name: "Menu" })).toBeInTheDocument();
    const nav = within(dialog).getByRole("navigation");
    expect(within(nav).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Loja", "Blog"]);
    expect(within(nav).getByRole("link", { name: "Blog" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Loja" })).not.toHaveAttribute("aria-current");
    const cta = within(dialog).getByRole("link", { name: "Entrar" });
    expect(cta).toHaveAttribute("href", "/login");
    expect(nav.contains(cta)).toBe(false); // CTA fica no rodapé fixo do painel, fora da lista
    expect(within(nav).getAllByRole("listitem")).toHaveLength(2);
  });

  it("clicar num item fecha o menu", async () => {
    const user = userEvent.setup();
    render(<AppHeader brand="X" items={items} labels={labels} />);
    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    await user.click(await within(await screen.findByRole("dialog")).findByRole("link", { name: "Loja" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});

describe("AppHeader", () => {
  it("abrir o menu com itens-link não gera console.error do Base UI (nativeButton)", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const user = userEvent.setup();
      render(
        <AppHeader brand="X" items={items} cta={{ href: "/login", label: "Entrar" }} menuHeaderActions={<span />} menuFooter={<p>rodapé</p>} labels={labels} />,
      );
      await user.click(screen.getByRole("button", { name: "Abrir menu" }));
      await screen.findByRole("dialog");
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it("renderiza marca com link, ações e gatilho com aria-label", () => {
    setup();
    expect(screen.getByRole("link", { name: "Meu Site" })).toHaveAttribute("href", "/");
    expect(screen.getByText("ação")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir menu" })).toHaveAttribute("aria-expanded", "false");
  });

  it("abre o menu (dialog com itens e rodapé) e fecha pelo botão", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("rodapé do menu");
    expect(screen.getAllByRole("link", { name: "Loja" }).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Fechar menu" }));
    await waitForMenuClosed();
  });

  it("fecha com Esc e devolve o foco ao gatilho", async () => {
    const user = setup();
    const trigger = screen.getByRole("button", { name: "Abrir menu" });
    await user.click(trigger);
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitForMenuClosed();
    expect(trigger).toHaveFocus();
  });
});

async function waitForMenuClosed() {
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
}
