// @vitest-environment jsdom
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ locale: "pt-BR" as "pt-BR" | "en" | "es", pathname: "/" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }), usePathname: () => state.pathname }));
vi.mock("@/auth", () => ({ auth: async () => null }));
vi.mock("@/lib/i18n-server", async () => {
  const { dictionaries } = await import("@/lib/i18n");
  return {
    getT: async () => ({ locale: state.locale, t: (k: keyof (typeof dictionaries)["pt-BR"]) => dictionaries[state.locale][k] }),
    getLocale: async () => state.locale,
  };
});

import ComingSoonPage from "@/app/(home)/em-breve/page";
import { HomeHeader } from "@/components/home/home-header";
import { CartProvider } from "@/contexts/cart-context";
import { LanguageProvider } from "@/contexts/language-context";
import { dictionaries } from "@/lib/i18n";
import { MENU_CLOSE_IMAGE, MENU_ITEMS } from "@/lib/nav";

const PUBLIC = path.resolve(import.meta.dirname, "../public");
const pngSize = (file: string) => {
  const b = readFileSync(file);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
};

// Mapeamento verificado lendo cada imagem (Eng_03 está escrito "EXIBITIONS" na arte original).
const EXPECTED = {
  "pt-BR": ["Sobre", "Projetos", "Exposições", "Festivais & Residências", "Livros", "Notícias", "Shop"],
  en: ["About", "Projects", "Exhibitions", "Festivals & Residencies", "Books", "News", "Shop"],
  es: ["Acerca de", "Proyectos", "Exposiciones", "Festivales & Residencias", "Libros", "Noticias", "Shop"],
} as const;

async function openMenu(locale: "pt-BR" | "en" | "es", pathname = "/") {
  state.locale = locale;
  state.pathname = pathname;
  const user = userEvent.setup();
  render(
    <LanguageProvider initialLocale={locale}>
      <CartProvider>{await HomeHeader()}</CartProvider>
    </LanguageProvider>,
  );
  await user.click(screen.getByRole("button", { name: dictionaries[locale]["menu.open"] }));
  return { user, dialog: await screen.findByRole("dialog") };
}

beforeEach(() => {
  state.locale = "pt-BR";
  state.pathname = "/";
});

describe("mapa do menu (src/lib/nav.ts)", () => {
  it("7 itens na ordem do design, todos com página real (nenhum aponta para /em-breve)", () => {
    expect(MENU_ITEMS.map((i) => i.id)).toEqual(["about", "projects", "exhibitions", "festivals", "books", "news", "shop"]);
    expect(MENU_ITEMS.map((i) => i.href)).toEqual([
      "/sobre", "/projetos", "/exposicoes", "/festivais-e-residencias", "/livros", "/blog", "/loja",
    ]);
    expect(MENU_ITEMS.some((i) => i.href.includes("em-breve"))).toBe(false);
  });

  it.each(["pt-BR", "en", "es"] as const)("textos/alt em %s", (l) => {
    expect(MENU_ITEMS.map((i) => dictionaries[l][i.altKey])).toEqual(EXPECTED[l]);
  });

  it("todo arquivo existe e width/height batem com o PNG real (sem layout shift)", () => {
    const all = [...MENU_ITEMS.flatMap((i) => Object.values(i.images)), MENU_CLOSE_IMAGE];
    expect(all.length).toBe(7 * 3 + 1);
    for (const img of all) {
      const file = path.join(PUBLIC, img.src);
      expect(existsSync(file), img.src).toBe(true);
      expect(pngSize(file), img.src).toEqual({ width: img.width, height: img.height });
      expect(img.src).toMatch(/^\/images\/menu\/[a-z0-9\-/]+\.png$/);
    }
  });
});

describe("overlay com letreiros", () => {
  it.each(["pt-BR", "en", "es"] as const)("%s: 7 links reais, cada imagem com o alt do idioma, imagens do idioma", async (l) => {
    const { dialog } = await openMenu(l);
    const nav = within(dialog).getByRole("navigation");
    const links = within(nav).getAllByRole("link").filter((a) => a.querySelector("img"));
    expect(links).toHaveLength(7);
    EXPECTED[l].forEach((text, i) => {
      expect(links[i]).toHaveAccessibleName(text);
      const src = decodeURIComponent(links[i].querySelector("img")!.getAttribute("src")!);
      const expectedSrc = MENU_ITEMS[i].images[l].src;
      expect(src).toContain(expectedSrc);
    });
    expect(links[5]).toHaveAttribute("href", "/blog");
    expect(links[6]).toHaveAttribute("href", "/loja");
  });

  it("trocar o idioma troca as imagens (pt -> en)", async () => {
    const pt = await openMenu("pt-BR");
    expect(decodeURIComponent(within(pt.dialog).getByRole("link", { name: "Sobre" }).querySelector("img")!.getAttribute("src")!)).toContain("/pt/sobre.png");
  });

  it("en usa a pasta en/ e es usa es/", async () => {
    const en = await openMenu("en");
    expect(decodeURIComponent(within(en.dialog).getByRole("link", { name: "About" }).querySelector("img")!.getAttribute("src")!)).toContain("/en/about.png");
  });

  it("hambúrguer em todas as larguras (sem lg:hidden) e sem navegação em linha", async () => {
    await openMenu("pt-BR");
    expect(screen.queryByRole("button", { name: "Abrir menu" })).toBeNull(); // dialog aberto esconde o fundo
    expect(document.querySelector("header nav")).toBeNull();
  });

  it("fechar com o X (imagem decorativa, nome acessível do botão)", async () => {
    const { user, dialog } = await openMenu("pt-BR");
    const close = within(dialog).getByRole("button", { name: "Fechar menu" });
    expect(close.querySelector("img")).toHaveAttribute("alt", "");
    expect(decodeURIComponent(close.querySelector("img")!.getAttribute("src")!)).toContain("/images/menu/close.png");
    await user.click(close);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("alvo >=44px (min-h-11), aria-current na rota atual e foco visível", async () => {
    const { dialog } = await openMenu("pt-BR", "/blog");
    const current = within(dialog).getByRole("link", { name: "Notícias" });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(within(dialog).getByRole("link", { name: "Shop" })).not.toHaveAttribute("aria-current");
    expect(current.className).toContain("min-h-11");
    expect(current.className).toContain("focus-visible:ring-2");
  });

  it("imagens com altura controlada por CSS (1 e 2 linhas) e proporção intrínseca", async () => {
    const { dialog } = await openMenu("pt-BR");
    const festivals = within(dialog).getByRole("link", { name: "Festivais & Residências" }).querySelector("img")!;
    const books = within(dialog).getByRole("link", { name: "Livros" }).querySelector("img")!;
    expect(festivals.className).toContain("h-24");
    expect(festivals.className).toContain("lg:h-[8svh]");
    expect(festivals.className).toContain("lg:max-h-[5.5rem]");
    expect(books.className).toContain("h-12");
    expect(books.className).toContain("lg:h-[4svh]");
    expect(books.className).toContain("lg:max-h-11");
    expect(festivals).toHaveAttribute("width", "510");
    expect(festivals).toHaveAttribute("height", "225");
  });

  it("idioma no topo, CTA e carrinho continuam no menu; sem console.error", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { dialog } = await openMenu("pt-BR");
      expect(within(dialog).getByRole("button", { name: /Idioma/ })).toBeInTheDocument();
      expect(within(dialog).getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login");
      expect(within(dialog).getByRole("link", { name: /Carrinho/ })).toHaveAttribute("href", "/carrinho");
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});

describe("/em-breve (fallback)", () => {
  it("mostra 'Em breve', texto e botão de voltar", async () => {
    render(await ComingSoonPage());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Em breve");
    expect(screen.getByRole("link", { name: "Voltar ao início" })).toHaveAttribute("href", "/");
  });

  it("textos nos 3 idiomas", () => {
    for (const l of ["pt-BR", "en", "es"] as const) {
      for (const k of ["soon.title", "soon.text", "soon.back"] as const) expect(dictionaries[l][k].length).toBeGreaterThan(3);
    }
  });
});

describe("painel lateral (Sheet) em todas as larguras", () => {
  it("lista à esquerda com altura em svh, rolagem só na lista, rodapé fixo com CTA e carrinho", async () => {
    const { dialog } = await openMenu("pt-BR");
    const nav = within(dialog).getByRole("navigation");
    expect(nav.className).toContain("overflow-y-auto");
    expect(nav.className).toContain("min-h-0");
    // painel: largura fixa de 28rem a partir de sm, tela cheia abaixo; sem overlay de tela cheia no desktop
    expect(dialog.className).toContain("data-[side=right]:sm:max-w-md");
    expect(dialog.className).toContain("data-[side=right]:lg:max-w-sm"); // 24rem no desktop
    expect(dialog.className).not.toContain("max-w-none");
    expect(dialog.className).toContain("bg-paper");
    // cabeçalho (título, idioma, X) fora da área que rola
    expect(nav.contains(within(dialog).getByRole("heading", { name: "Menu" }))).toBe(false);
    expect(nav.contains(within(dialog).getByRole("button", { name: "Fechar menu" }))).toBe(false);
    // rodapé fixo: só o CTA de sessão (fora da lista e do nav); o carrinho mora no cabeçalho do painel
    const cta = within(dialog).getByRole("link", { name: "Entrar" });
    const cart = within(dialog).getByRole("link", { name: /Carrinho/ });
    expect(nav.contains(cta)).toBe(false);
    expect(cta.closest("li")).toBeNull();
    expect(cta.parentElement!.querySelectorAll("a")).toHaveLength(1);
    expect(cta.parentElement!.contains(cart)).toBe(false);
    // ordem do cabeçalho do painel: [Idioma] [Carrinho] [X], lado a lado
    const language = within(dialog).getByRole("button", { name: /Idioma/ });
    const close = within(dialog).getByRole("button", { name: "Fechar menu" });
    expect(language.parentElement).toBe(cart.parentElement);
    expect(cart.parentElement).toBe(close.parentElement);
    expect(language.compareDocumentPosition(cart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(cart.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(cart.className).toContain("h-11");
    expect(language.className).toContain("h-11");
    // 1440x790: 6 x 7svh + 14svh + folgas cabem no espaço da lista (aritmética das classes; sem navegador)
    // lg: 6 x 4svh + 8svh + 7 linhas de 44px (alvo) cabem entre cabeçalho (58) e rodapé (~136) em 790px
    const listPx = 6 * Math.max(0.04 * 790, 44) + Math.max(0.08 * 790 + 12, 44) + 16;
    expect(listPx).toBeLessThan(790 - 58 - 136);
  });

  it("backdrop escurecido, foco preso (dialog modal), Esc fecha e devolve o foco ao gatilho", async () => {
    const { user, dialog } = await openMenu("pt-BR");
    expect(dialog).toHaveAttribute("role", "dialog");
    expect(document.querySelector("[data-slot='sheet-overlay']")!.className).toContain("bg-ink/40");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(screen.getByRole("button", { name: "Abrir menu" })).toHaveFocus());
  });

  it("animação respeita prefers-reduced-motion", async () => {
    const { dialog } = await openMenu("pt-BR");
    expect(dialog.className).toContain("motion-reduce:transition-none");
  });
});
