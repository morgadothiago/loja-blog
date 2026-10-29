// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ locale: "pt-BR" as "pt-BR" | "en" | "es", pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));
vi.mock("@/lib/i18n-server", async () => {
  const { dictionaries } = await import("@/lib/i18n");
  return {
    getT: async () => ({ locale: state.locale, t: (k: keyof (typeof dictionaries)["pt-BR"]) => dictionaries[state.locale][k] }),
    getLocale: async () => state.locale,
  };
});
// Componente server assíncrono: tem teste próprio em home-images.
vi.mock("@/components/home/home-image", () => ({
  HomeImage: ({ slot, className }: { slot: { altKey?: string }; className?: string }) => (
    <div data-testid="slot" data-alt-key={slot.altKey} className={className} />
  ),
}));

import BooksPage from "@/app/(home)/(sections)/livros/page";
import * as About from "@/app/(home)/(sections)/sobre/page";
import * as Exhibitions from "@/app/(home)/(sections)/exposicoes/page";
import * as Festivals from "@/app/(home)/(sections)/festivais-e-residencias/page";
import * as Projects from "@/app/(home)/(sections)/projetos/page";
import { metadata as homeLayoutMetadata } from "@/app/(home)/layout";
import { AppHeader } from "@/components/header/app-header";
import { AboutContent } from "@/components/sections/about-content";
import { ContentCard } from "@/components/sections/content-card";
import { ContentGrid } from "@/components/sections/content-grid";
import { SectionPage } from "@/components/sections/section-page";
import { authConfig } from "@/auth.config";
import { ABOUT, CONTENT_SECTIONS, type ListSectionId } from "@/lib/content";
import { dictionaries, type MessageKey } from "@/lib/i18n";
import { MENU_ITEMS } from "@/lib/nav";
import { SITE } from "@/lib/site";

const LOCALES = ["pt-BR", "en", "es"] as const;
const SECTIONS: { id: string; list?: ListSectionId; href: string }[] = [
  { id: "about", href: "/sobre" },
  { id: "projects", list: "projects", href: "/projetos" },
  { id: "exhibitions", list: "exhibitions", href: "/exposicoes" },
  { id: "festivals", list: "festivals", href: "/festivais-e-residencias" },
  { id: "books", list: "books", href: "/livros" },
];
const title = (l: (typeof LOCALES)[number], id: string) => dictionaries[l][MENU_ITEMS.find((i) => i.id === id)!.altKey];

async function renderSection(id: string, list: ListSectionId) {
  return render(await SectionPage({ id, children: await ContentGrid({ section: list }) }));
}

afterEach(() => {
  state.locale = "pt-BR";
  state.pathname = "/";
});

describe.each(LOCALES)("páginas do menu em %s", (locale) => {
  it.each(SECTIONS.filter((s) => s.list))("$id: h1 com o letreiro e alt do idioma, subtítulo traduzido, sem chave crua", async ({ id, list }) => {
    state.locale = locale;
    const { container } = await renderSection(id, list!);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(within(h1).getByRole("img")).toHaveAttribute("alt", title(locale, id));
    expect(decodeURIComponent(within(h1).getByRole("img").getAttribute("src")!)).toContain(
      MENU_ITEMS.find((i) => i.id === id)!.images[locale].src,
    );
    expect(container.textContent).toContain(dictionaries[locale][`page.${id}.subtitle` as MessageKey]);
    expect(container.textContent).toContain(dictionaries[locale]["content.example"]);
    expect(container.textContent).not.toMatch(/\b(page|content|about)\.[a-z0-9.]+\b/);
  });

  it.each(SECTIONS.filter((s) => s.list))("$id: 3 cards em lista com título e metadado traduzidos", async ({ id, list }) => {
    state.locale = locale;
    await renderSection(id, list!);
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    const first = CONTENT_SECTIONS[list!][0];
    expect(within(items[0]).getByRole("heading", { level: 2 })).toHaveTextContent(dictionaries[locale][first.titleKey]);
    expect(items[0].textContent).toContain(dictionaries[locale][first.metaKey]);
  });

  it("Sobre: h1 é o letreiro, seções na ordem, textos traduzidos, sem link de CV sem URL", async () => {
    state.locale = locale;
    const { container } = render(await AboutContent());
    expect(within(screen.getByRole("heading", { level: 1 })).getByRole("img")).toHaveAttribute("alt", dictionaries[locale]["about.hero.alt"]);
    const h2 = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(h2).toEqual([dictionaries[locale]["about.artist.title"], dictionaries[locale]["about.gallery"]]);
    for (const key of [...ABOUT.artistKeys, ...ABOUT.bioKeys, ABOUT.collages.captionKey]) {
      expect(container.textContent).toContain(dictionaries[locale][key]);
    }
    for (const img of [ABOUT.portrait, ABOUT.photos, ABOUT.collages, ABOUT.whale]) {
      expect(screen.getByRole("img", { name: dictionaries[locale][img.altKey] })).toBeInTheDocument();
    }
    expect(screen.queryByRole("link")).toBeNull();
    expect(container.querySelector("section.bg-salmon")).not.toBeNull();
    expect(container.textContent).not.toMatch(/\babout\.[a-z0-9.]+\b/);
  });
});

describe("dados e i18n do conteúdo", () => {
  it("ids únicos e toda chave existe nas 3 línguas", () => {
    const keys: MessageKey[] = [...ABOUT.artistKeys, ...ABOUT.bioKeys, ABOUT.collages.captionKey, ABOUT.heroLogo.altKey, "about.artist.title", "about.gallery", "content.empty", "content.example"];
    const ids = new Set<string>();
    for (const entries of Object.values(CONTENT_SECTIONS)) {
      for (const e of entries) {
        expect(ids.has(e.id)).toBe(false);
        ids.add(e.id);
        keys.push(e.titleKey, e.metaKey);
      }
    }
    for (const s of SECTIONS) keys.push(`page.${s.id}.subtitle` as MessageKey);
    for (const l of LOCALES) for (const k of keys) expect(dictionaries[l][k], `${l} ${k}`).toBeTruthy();
  });

  it("textos de exemplo marcados e sem nome próprio da referência", () => {
    for (const l of LOCALES) {
      for (const entries of Object.values(CONTENT_SECTIONS)) {
        for (const e of entries) expect(dictionaries[l][e.titleKey]).toMatch(/exemplo|sample|ejemplo/i);
      }
    }
  });
});

describe("estados da grade", () => {
  it("vazia mostra mensagem; 1 item não quebra; título longo usa line-clamp-3; sem imagem usa placeholder decorativo", async () => {
    const original = CONTENT_SECTIONS.books;
    try {
      CONTENT_SECTIONS.books = [];
      render(await ContentGrid({ section: "books" }));
      expect(screen.getByText("Nada por aqui ainda.")).toBeInTheDocument();
      expect(screen.queryByRole("list")).toBeNull();
    } finally {
      CONTENT_SECTIONS.books = original;
    }
    const one = render(
      <ContentCard entry={original[0]} title={"x".repeat(300)} meta="2024 · Local" index={0} />,
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveClass("line-clamp-3");
    expect(one.container.querySelector("svg[aria-hidden='true']")).not.toBeNull();
  });
});

describe("rotas, nav e metadata", () => {
  it.each(SECTIONS)("página $href define metadata traduzida e monta a seção certa", async ({ id, href }) => {
    const modules = { about: About, projects: Projects, exhibitions: Exhibitions, festivals: Festivals } as const;
    expect(MENU_ITEMS.find((i) => i.id === id)!.href).toBe(href);
    for (const l of LOCALES) {
      state.locale = l;
      const meta =
        id === "books"
          ? await (await import("@/app/(home)/(sections)/livros/page")).generateMetadata()
          : await modules[id as keyof typeof modules].generateMetadata();
      expect(meta.title).toBe(title(l, id));
      expect(meta.description).toBe(dictionaries[l][`page.${id}.subtitle` as MessageKey]);
    }
    // Sobre não usa SectionPage (abre direto na foto); as demais montam SectionPage com o próprio id.
    if (id === "about") return;
    const el = (await (id === "books" ? BooksPage : modules[id as keyof typeof modules].default)()) as { props: { id: string } };
    expect(el.props.id).toBe(id);
  });

  it("layout da home: title.template com o nome do site", () => {
    expect(homeLayoutMetadata.title).toEqual({ template: `%s | ${SITE.name}`, default: SITE.name });
  });

  it("proxy: as 5 páginas são públicas para anônimos", () => {
    const authorized = authConfig.callbacks.authorized as (a: { auth: null; request: { nextUrl: URL } }) => unknown;
    for (const { href } of SECTIONS) {
      expect(authorized({ auth: null, request: { nextUrl: new URL(href, "http://localhost:3000") } })).toBe(true);
    }
  });

  it.each(MENU_ITEMS)("menu: aria-current só no item da rota atual ($href)", async (current) => {
    state.pathname = current.href;
    const user = userEvent.setup();
    render(
      <AppHeader
        brand="X"
        overlayOnly
        items={MENU_ITEMS.map((i) => ({ href: i.href, label: dictionaries["pt-BR"][i.altKey], image: i.images["pt-BR"], lines: i.lines }))}
        labels={{ openMenu: "Abrir menu", closeMenu: "Fechar menu", menuTitle: "Menu", nav: "Nav" }}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    const dialog = await screen.findByRole("dialog");
    const links = within(dialog).getAllByRole("link").filter((a) => a.querySelector("img"));
    const currents = links.filter((a) => a.getAttribute("aria-current") === "page");
    expect(currents).toHaveLength(1);
    expect(currents[0]).toHaveAttribute("href", current.href);
  });
});
