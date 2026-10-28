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

describe("AppHeader: botão do menu em imagem (hamburger)", () => {
  const menuImage = { src: "/images/menu/hamburger-ink.png", width: 200, height: 184 };

  it("imagem decorativa dentro do <button> com aria-label, aria-expanded, alvo 44px e foco visível", async () => {
    const user = userEvent.setup();
    render(<AppHeader brand="X" items={items} labels={labels} menuImage={menuImage} overlayOnly />);
    const button = screen.getByRole("button", { name: "Abrir menu" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-haspopup", "dialog");
    expect(button.className).toContain("size-11"); // 44x44
    expect(button.className).toContain("focus-visible:ring-3");
    expect(button.className).not.toContain("lg:hidden"); // overlayOnly: hambúrguer em todas as larguras
    const img = button.querySelector("img")!;
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("width", "200");
    expect(img).toHaveAttribute("height", "184");
    expect(img.className).toContain("h-8");
    expect(img.className).toContain("w-auto");
    expect(decodeURIComponent(img.getAttribute("src")!)).toContain("/images/menu/hamburger-ink.png");
    expect(button.querySelector("svg")).toBeNull(); // sem o ícone de linhas do lucide
    await user.click(button);
    await screen.findByRole("dialog");
    expect(document.querySelector("[aria-haspopup='dialog']")).toHaveAttribute("aria-expanded", "true");
  });

  it("sem menuImage continua o ícone de linhas (componente reutilizável)", () => {
    render(<AppHeader brand="X" items={items} labels={labels} />);
    expect(screen.getByRole("button", { name: "Abrir menu" }).querySelector("svg")).not.toBeNull();
  });

  it("o arquivo existe, tem 200x184 e é escuro (cor --ink 30,26,23) com alto contraste sobre bege e claro; o original branco está fora do build", async () => {
    const { existsSync } = await import("node:fs");
    const path = await import("node:path");
    const sharp = (await import("sharp")).default;
    const root = path.resolve(import.meta.dirname, "..");
    const inkFile = path.join(root, "public", menuImage.src);
    expect(existsSync(inkFile)).toBe(true);
    expect(existsSync(path.join(root, "public/images/menu/hamburger.png"))).toBe(false); // original branco não é servido
    expect(existsSync(path.join(root, "design-assets/menu-originals/hamburger-white.png"))).toBe(true);

    const { data, info } = await sharp(inkFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([200, 184]);
    let opaque = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) {
        opaque++;
        expect([data[i], data[i + 1], data[i + 2]]).toEqual([30, 26, 23]);
      }
    }
    expect(opaque).toBeGreaterThan(1000);

    // contraste WCAG de rgb(30,26,23) contra o bege do hero e o claro do header (valores sRGB aproximados dos tokens)
    const lum = ([r, g, b]: number[]) => {
      const f = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a: number[], b: number[]) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    for (const bg of [[240, 228, 208], [252, 249, 242]]) expect(ratio([30, 26, 23], bg)).toBeGreaterThan(7);
  });
});
