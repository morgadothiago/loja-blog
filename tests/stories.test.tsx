// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n-server", async () => {
  const { dictionaries } = await import("@/lib/i18n");
  return { getT: async () => ({ locale: "pt-BR", t: (k: keyof typeof dictionaries["pt-BR"]) => dictionaries["pt-BR"][k] }) };
});

import { RecentStories } from "@/components/home/recent-stories";
import { StoryCard, type Story } from "@/components/home/story-card";

const story = (n: number, over: Partial<Story> = {}): Story => ({
  id: `id${n}`,
  slug: `post-${n}`,
  title: `Título ${n}`,
  coverUrl: null,
  categoryName: "Arte",
  createdAt: new Date("2025-03-10T12:00:00Z"),
  ...over,
});

describe("StoryCard", () => {
  it("link para o post, categoria e data; sem capa usa placeholder decorativo", () => {
    const { container } = render(<StoryCard story={story(1)} index={0} locale="pt-BR" />);
    expect(screen.getByRole("link", { name: /Título 1/ })).toHaveAttribute("href", "/blog/post-1");
    expect(screen.getByText(/ARTE|Arte/i)).toBeInTheDocument();
    expect(container.querySelector("svg[aria-hidden='true']")).not.toBeNull();
  });

  it("título longo fica contido (line-clamp) e sem categoria mostra só a data", () => {
    render(<StoryCard story={story(2, { title: "x".repeat(300), categoryName: null })} index={1} locale="pt-BR" />);
    expect(screen.getByRole("heading", { level: 3 })).toHaveClass("line-clamp-3");
    expect(screen.getByText(/2025/)).not.toHaveTextContent("·");
  });
});

describe("RecentStories", () => {
  it("0 posts: mantém o esqueleto da referência com 3 cards de exemplo (título, categoria · ano) e sem link 'ver todas'", async () => {
    render(await RecentStories({ stories: [] }));
    expect(screen.getByRole("heading", { level: 2, name: "Histórias RECENTES" })).toBeInTheDocument();
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(screen.getByRole("heading", { level: 3, name: "Título de uma história de exemplo" })).toBeInTheDocument();
    expect(screen.getAllByText(/Exemplo · 2024/i)).toHaveLength(3);
    for (const a of screen.getAllByRole("link")) expect(a).toHaveAttribute("href", "/blog");
    expect(screen.queryByText(/Ver todas/)).toBeNull();
    expect(screen.queryByText(/Em breve/)).toBeNull();
  });

  it.each([1, 3])("%i post(s): um item de lista por post", async (n) => {
    render(await RecentStories({ stories: Array.from({ length: n }, (_, i) => story(i + 1)) }));
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(n);
  });
});

describe("RecentStories: layout da referência", () => {
  it("3 colunas desde o mobile (sem carrossel/rolagem horizontal), cards com proporções diferentes e leve rotação", async () => {
    const { container } = render(await RecentStories({ stories: [1, 2, 3].map((n) => story(n)) }));
    const list = screen.getByRole("list");
    expect(list).toHaveClass("grid", "grid-cols-3");
    expect(list.className).not.toMatch(/overflow-x|snap-/);
    const frames = Array.from(container.querySelectorAll<HTMLElement>("li a > div"));
    const aspects = frames.map((f) => /aspect-\S+/.exec(f.className)?.[0]);
    expect(new Set(aspects).size).toBe(3);
    expect(frames[2]).toHaveClass("rotate-1");
    expect(frames[0].className).not.toMatch(/rotate-/);
  });
});
