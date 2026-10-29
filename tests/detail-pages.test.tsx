// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ locale: "pt-BR" as "pt-BR" | "en" | "es" }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("@/lib/i18n-server", async () => {
  const { dictionaries } = await import("@/lib/i18n");
  return {
    getT: async () => ({ locale: state.locale, t: (k: keyof (typeof dictionaries)["pt-BR"]) => dictionaries[state.locale][k] }),
    getLocale: async () => state.locale,
  };
});

import ResidencyPage, { generateMetadata as residencyMeta } from "@/app/(home)/(sections)/festivais-e-residencias/[slug]/page";
import PracticePage, { generateMetadata as practiceMeta } from "@/app/(home)/(sections)/praticas/[tipo]/page";
import ProjectPage, { generateMetadata as projectMeta } from "@/app/(home)/(sections)/projetos/[slug]/page";
import { ContentCard } from "@/components/sections/content-card";
import { ContentGrid } from "@/components/sections/content-grid";
import { DetailGallery } from "@/components/sections/detail-gallery";
import { PracticeGallery } from "@/components/sections/practice-gallery";
import { PracticeNav } from "@/components/sections/practice-nav";
import { RelatedList } from "@/components/sections/related-list";
import { YearList } from "@/components/sections/year-list";
import { CONTENT_SECTIONS } from "@/lib/content";
import { PROJECT_DETAILS } from "@/lib/content/projects";
import { RESIDENCY_DETAILS } from "@/lib/content/residencies";
import { dictionaries } from "@/lib/i18n";
import { resolveServer } from "./resolve-server";

const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) }) as never;
const LOCALES = ["pt-BR", "en", "es"] as const;
afterEach(() => {
  state.locale = "pt-BR";
});

describe.each(LOCALES)("detalhe de projeto em %s", (locale) => {
  it("h1 único com o título, voltar, meta, lead, imagens com alt do idioma e link da prática", async () => {
    state.locale = locale;
    const d = dictionaries[locale];
    render(await resolveServer(await ProjectPage(params({ slug: "projeto-exemplo-1" }))));
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(d["content.projects.1.title"]);
    const back = screen.getByRole("link", { name: d["detail.back.projects"] });
    expect(back).toHaveAttribute("href", "/projetos");
    expect(back).toHaveClass("min-h-11");
    expect(screen.getByText(d["content.projects.1.meta"])).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(d["practice.drawing"]) })).toHaveAttribute("href", "/praticas/desenho");
    const detail = PROJECT_DETAILS[0];
    expect(screen.getByText(detail.body[0][locale])).toBeInTheDocument();
    for (const img of [detail.cover, ...detail.gallery]) {
      expect(screen.getByAltText(img.alt[locale])).toBeInTheDocument();
    }
    expect(screen.queryAllByRole("img").filter((i) => !i.getAttribute("alt"))).toHaveLength(0);
  });

  it("metadata no idioma: título e resumo", async () => {
    state.locale = locale;
    const meta = await projectMeta(params({ slug: "projeto-exemplo-1" }));
    expect(meta).toEqual({ title: dictionaries[locale]["content.projects.1.title"], description: PROJECT_DETAILS[0].summary[locale] });
  });
});

describe("404 por slug", () => {
  it("projeto, residência e prática inexistentes chamam notFound()", async () => {
    await expect(ProjectPage(params({ slug: "nao-existe" }))).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(ResidencyPage(params({ slug: "projeto-exemplo-1" }))).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(PracticePage(params({ tipo: "pintura" }))).rejects.toThrow("NEXT_NOT_FOUND");
    expect(await projectMeta(params({ slug: "nao-existe" }))).toEqual({});
    expect(await residencyMeta(params({ slug: "x" }))).toEqual({});
    expect(await practiceMeta(params({ tipo: "x" }))).toEqual({});
  });
});

describe("detalhe de residência", () => {
  it("créditos, galeria e 2 'outras jornadas' como links (sem a atual)", async () => {
    state.locale = "en";
    const d = dictionaries.en;
    render(await resolveServer(await ResidencyPage(params({ slug: "residencia-exemplo-1" }))));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(d["content.festivals.1.title"]);
    expect(screen.getByRole("heading", { level: 2, name: d["detail.credits"] })).toBeInTheDocument();
    expect(screen.getByText(/Sample participant A · Sample participant B/)).toBeInTheDocument();
    const related = screen.getByRole("heading", { level: 2, name: d["detail.related"] }).closest("section")!;
    const links = within(related).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "/festivais-e-residencias/residencia-exemplo-2",
      "/festivais-e-residencias/residencia-exemplo-3",
    ]);
    expect(within(related).getByRole("link", { name: new RegExp(d["content.festivals.2.title"]) })).toBeInTheDocument();
  });

  it("sem galeria e sem créditos: seções omitidas", async () => {
    render(await resolveServer(await ResidencyPage(params({ slug: "residencia-exemplo-2" }))));
    expect(RESIDENCY_DETAILS[1].gallery).toHaveLength(0);
    expect(screen.queryByRole("heading", { name: dictionaries["pt-BR"]["detail.gallery"] })).toBeNull();
    expect(screen.queryByRole("heading", { name: dictionaries["pt-BR"]["detail.credits"] })).toBeNull();
  });
});

describe("componentes de estado vazio", () => {
  it("RelatedList com 0 itens e DetailGallery vazia não renderizam nada", async () => {
    expect((render(await RelatedList({ items: [] }))).container).toBeEmptyDOMElement();
    expect((render(await DetailGallery({ images: [] }))).container).toBeEmptyDOMElement();
  });

  it("PracticeGallery vazia mostra 'Em breve.'", async () => {
    render(await PracticeGallery({ works: [] }));
    expect(screen.getByText("Em breve.")).toBeInTheDocument();
  });

  it("DetailGallery: recuo vertical só no 2º item (grid)", async () => {
    const { container } = render(await DetailGallery({ images: [...PROJECT_DETAILS[0].gallery, ...PROJECT_DETAILS[0].gallery, ...PROJECT_DETAILS[0].gallery] }));
    const items = Array.from(container.querySelectorAll("li"));
    expect(items.map((li) => li.className.includes("md:mt-12"))).toEqual([false, true, false, false, false, false]);
  });
});

describe("práticas", () => {
  it("filtra pelo tipo, nav com aria-current e links para o projeto", async () => {
    render(await resolveServer(await PracticePage(params({ tipo: "ceramica" }))));
    const d = dictionaries["pt-BR"];
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(d["practice.ceramic"]);
    expect(screen.getByRole("link", { name: d["practice.ceramic"] })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: d["practice.drawing"] })).not.toHaveAttribute("aria-current");
    const gallery = screen.getAllByRole("list").find((l) => l.className.includes("columns-1"))!;
    const hrefs = within(gallery).getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(new Set(hrefs)).toEqual(new Set(["/projetos/projeto-exemplo-2"]));
    expect(hrefs).toHaveLength(1 + PROJECT_DETAILS[1].gallery.length);
  });

  it("nav das práticas: 3 chips com alvo >= 2,75rem e destino em português", async () => {
    render(await PracticeNav({}));
    const links = within(screen.getByRole("navigation", { name: "Práticas" })).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/praticas/desenho", "/praticas/ceramica", "/praticas/colagem"]);
    links.forEach((a) => {
      expect(a).toHaveClass("h-11");
      expect(a).not.toHaveAttribute("aria-current");
    });
  });
});

describe("listas", () => {
  it("projetos e residências: cada card é link com nome acessível contendo o título; livros: sem link", async () => {
    for (const [section, key, base] of [
      ["projects", "projects", "/projetos/"],
      ["festivals", "festivals", "/festivais-e-residencias/"],
    ] as const) {
      const { unmount } = render(await ContentGrid({ section }));
      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(3);
      links.forEach((a, i) => {
        expect(a.getAttribute("href")!.startsWith(base)).toBe(true);
        expect(a).toHaveAccessibleName(new RegExp(dictionaries["pt-BR"][`content.${key}.${i + 1}.title` as "content.projects.1.title"]));
      });
      unmount();
    }
    render(await ContentGrid({ section: "books" }));
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("ContentCard sem href não é link", () => {
    render(<ContentCard entry={{ ...CONTENT_SECTIONS.books[0] }} title="T" meta="M" index={0} />);
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("YearList", () => {
  it("ul com N li: ano, título (h2) e local; nas 3 línguas", async () => {
    for (const locale of LOCALES) {
      state.locale = locale;
      const d = dictionaries[locale];
      const items = CONTENT_SECTIONS.exhibitions.map((e) => ({ id: e.id, year: e.year!, title: d[e.titleKey], place: d[e.placeKey!] }));
      const { unmount } = render(await YearList({ items }));
      const rows = within(screen.getByRole("list")).getAllByRole("listitem");
      expect(rows).toHaveLength(3);
      expect(rows[0]).toHaveTextContent("2025");
      expect(within(rows[0]).getByRole("heading", { level: 2 })).toHaveTextContent(d["content.exhibitions.1.title"]);
      expect(rows[0]).toHaveTextContent(d["content.exhibitions.1.place"]);
      unmount();
    }
  });

  it("vazia: mensagem i18n e sem lista; 1 item não quebra", async () => {
    state.locale = "es";
    const empty = render(await YearList({ items: [] }));
    expect(screen.getByText(dictionaries.es["content.empty"])).toBeInTheDocument();
    expect(screen.queryByRole("list")).toBeNull();
    empty.unmount();
    render(await YearList({ items: [{ id: "a", year: "2020", title: "x".repeat(200), place: "L" }] }));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });
});
