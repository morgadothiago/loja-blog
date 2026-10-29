// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Locale } from "@/lib/i18n";

let currentLocale: Locale = "pt-BR";
vi.mock("@/lib/i18n-server", async () => {
  const { dictionaries } = await import("@/lib/i18n");
  return { getT: async () => ({ locale: currentLocale, t: (k: keyof (typeof dictionaries)["pt-BR"]) => dictionaries[currentLocale][k] }) };
});

import { RecentStories } from "@/components/home/recent-stories";
import { StoryCard } from "@/components/home/story-card";
import { HOME_STORIES } from "@/lib/content/home-stories";

beforeEach(() => {
  currentLocale = "pt-BR";
});

describe("HOME_STORIES (conteúdo curado)", () => {
  it("3 projetos com título, ano, local e alt nas 3 línguas", () => {
    expect(HOME_STORIES).toHaveLength(3);
    for (const s of HOME_STORIES) {
      expect(s.title.length).toBeGreaterThan(3);
      for (const l of ["pt-BR", "en", "es"] as const) {
        expect(s.place[l].length).toBeGreaterThan(3);
        expect(s.alt[l].length).toBeGreaterThan(10);
      }
    }
  });
});

describe("StoryCard", () => {
  it("link para /projetos com meta em caixa-alta (local · ano) e título h3 em serifa", () => {
    render(<StoryCard story={HOME_STORIES[0]} index={0} locale="pt-BR" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/projetos");
    expect(within(link).getByRole("heading", { level: 3, name: "The More-Than-Human Rights Mural" })).not.toHaveClass("font-sans");
    const meta = screen.getByText("Design Museum, Londres · 2025");
    expect(meta).toHaveClass("uppercase", "text-xs", "tracking-widest");
    expect(within(link).getByRole("img")).toHaveAttribute("alt", HOME_STORIES[0].alt["pt-BR"]);
  });

  it("local traduzido por idioma", () => {
    render(<StoryCard story={HOME_STORIES[0]} index={0} locale="en" />);
    expect(screen.getByText("Design Museum, London · 2025")).toBeInTheDocument();
  });

  it("rotação só no 1º (md+) e recuo de 4rem só no 2º", () => {
    const { container } = render(
      <>
        {HOME_STORIES.map((s, i) => (
          <StoryCard key={s.id} story={s} index={i} locale="pt-BR" />
        ))}
      </>,
    );
    const links = container.querySelectorAll("a");
    expect(links[1]).toHaveClass("md:mt-16");
    expect(links[0].className).not.toContain("md:mt-16");
    expect(links[0].firstElementChild!.className).toContain("md:-rotate-[1.5deg]");
    expect(links[2].firstElementChild!.className).not.toMatch(/rotate/);
  });
});

describe("RecentStories (spec 0013, ref-3)", () => {
  it("h2 'Histórias' + palavra manuscrita, link 'Todos os projetos →' e 3 cards em 1 coluna (3 em md+)", async () => {
    render(await RecentStories());
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2).toHaveTextContent("Histórias recentes");
    expect(within(h2).getByText("recentes")).toHaveClass("font-hand", "text-primary");
    expect(screen.getByRole("link", { name: "Todos os projetos →" })).toHaveAttribute("href", "/projetos");
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(list).toHaveClass("grid", "md:grid-cols-3");
    expect(list.className).not.toMatch(/(^|\s)grid-cols-3|overflow-x|snap-/);
    expect(within(list).getAllByRole("heading", { level: 3 })).toHaveLength(3);
  });

  it("en: ordem texto + manuscrito ('Recent stories') e es: 'Historias recientes'", async () => {
    currentLocale = "en";
    const en = render(await RecentStories());
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Recent stories");
    expect(screen.getByRole("link", { name: "All projects →" })).toBeInTheDocument();
    en.unmount();
    currentLocale = "es";
    render(await RecentStories());
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Historias recientes");
    expect(screen.getByRole("link", { name: "Todos los proyectos →" })).toBeInTheDocument();
  });
});
