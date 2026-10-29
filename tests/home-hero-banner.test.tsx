// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Locale } from "@/lib/i18n";

let currentLocale: Locale = "pt-BR";
vi.mock("@/lib/i18n-server", async () => {
  const { dictionaries } = await import("@/lib/i18n");
  return { getT: async () => ({ locale: currentLocale, t: (k: keyof (typeof dictionaries)["pt-BR"]) => dictionaries[currentLocale][k] }) };
});

// Componentes server assíncronos não renderizam dentro do RTL; HomeImage tem teste próprio.
vi.mock("@/components/home/home-image", () => ({
  HomeImage: ({ className, eager }: { className?: string; eager?: boolean }) => <div data-testid="slot" data-eager={eager ? "1" : "0"} className={className} />,
}));

import { HomeBanner } from "@/components/home/home-banner";
import { HomeIntro } from "@/components/home/home-intro";

beforeEach(() => {
  currentLocale = "pt-BR";
});

describe("HomeIntro (spec 0013, ref-1)", () => {
  it.each([
    ["pt-BR", "um mar de", "encontros", ["Navegar", "Sentir", "Olhar", "Contemplar"]],
    ["en", "a sea of", "encounters", ["Navigate", "Feel", "Look", "Contemplate"]],
    ["es", "un mar de", "encuentros", ["Navegar", "Sentir", "Mirar", "Contemplar"]],
  ] as const)("%s: h1 único em 2 linhas (2ª em <em> musgo), eyebrow e 4 palavras em lista", async (locale, a, b, words) => {
    currentLocale = locale;
    render(await HomeIntro());
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(h1).toHaveTextContent(`${a}${b}`);
    expect(h1.querySelector("em")).toHaveTextContent(b);
    expect(h1.querySelector("em")).toHaveClass("text-moss");
    expect(screen.getByText(/—$/)).toHaveClass("font-hand", "text-primary");
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((i) => i.textContent)).toEqual(words);
    // nenhuma chave i18n crua vazou para a tela
    expect(document.body.textContent).not.toMatch(/home\.\w+/);
  });

  it("mural inclinado (rotate-2, 4:5), único slot prioritário (LCP) e sem mariposa", async () => {
    const { container } = render(await HomeIntro());
    const slot = screen.getByTestId("slot");
    expect(slot).toHaveClass("aspect-[4/5]", "rotate-2");
    expect(slot).toHaveAttribute("data-eager", "1");
    expect(container.querySelector("img")).toBeNull();
  });

  it("sem animação em loop e sem unidade px nas classes", async () => {
    const { container } = render(await HomeIntro());
    expect(container.innerHTML).not.toMatch(/float-slow|animate-|infinite|\d+px/);
  });
});

describe("HomeBanner (spec 0013, ref-2)", () => {
  it("2:1 no mobile, 5:2 em md+, dentro de page-width, com legenda visível e sem altura de janela", async () => {
    const { container } = render(await HomeBanner());
    expect(container.querySelector("figure")).not.toBeNull();
    expect(container.querySelector("figcaption")).toHaveTextContent("Mural MOTH · Design Museum, Londres, 2025");
    const slot = screen.getByTestId("slot");
    expect(slot).toHaveClass("aspect-[2/1]", "md:aspect-[5/2]", "w-full");
    expect(slot.closest(".page-width")).not.toBeNull();
    expect(container.innerHTML).not.toMatch(/vh|svh/);
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("legenda traduzida em en e es", async () => {
    for (const [locale, text] of [["en", "MOTH Mural · Design Museum, London, 2025"], ["es", "Mural MOTH · Design Museum, Londres, 2025"]] as const) {
      currentLocale = locale;
      const { container, unmount } = render(await HomeBanner());
      expect(container.querySelector("figcaption")).toHaveTextContent(text);
      unmount();
    }
  });
});
