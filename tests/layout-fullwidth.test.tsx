// @vitest-environment jsdom
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n-server", async () => {
  const { dictionaries } = await import("@/lib/i18n");
  return { getT: async () => ({ locale: "pt-BR", t: (k: keyof (typeof dictionaries)["pt-BR"]) => dictionaries["pt-BR"][k] }) };
});
vi.mock("@/components/home/home-image", () => ({
  HomeImage: ({ className, sizes }: { className?: string; sizes: string }) => <div data-testid="slot" data-sizes={sizes} className={className} />,
}));

import { HomeBanner } from "@/components/home/home-banner";
import { HomeFeature } from "@/components/home/home-feature";
import { HomeFooter } from "@/components/home/home-footer";
import { HomeHero } from "@/components/home/home-hero";
import { NewsletterBand } from "@/components/home/newsletter-band";
import { RecentStories } from "@/components/home/recent-stories";

vi.mock("@/components/home/newsletter-form", () => ({ NewsletterForm: () => <form /> }));

const CSS = () => readFileSync(path.resolve(import.meta.dirname, "../src/app/globals.css"), "utf8");

describe("largura máxima única: fundo full-bleed + conteúdo em .page-width", () => {
  it("token --content-max (90rem) e utilitário page-width (px-5 fixo); sem content-fit nem container antigo", () => {
    const css = CSS();
    expect(css).toMatch(/--content-max:\s*90rem/);
    expect(css).toMatch(/@utility page-width \{\s*@apply mx-auto w-full px-5;\s*max-width: var\(--content-max\);\s*\}/);
    expect(css).toMatch(/@utility px-fluid \{\s*@apply px-5;\s*\}/);
    expect(css).not.toMatch(/content-fit|--container-site|site-container|site-gutter/);
  });

  it.each([
    ["hero", () => HomeHero()],
    ["banner", () => HomeBanner()],
    ["histórias", () => RecentStories({ stories: [] })],
    ["destaque", () => HomeFeature()],
    ["newsletter", () => NewsletterBand()],
    ["rodapé", () => HomeFooter()],
  ])("%s: conteúdo em .page-width e fundo/seção sem max-w próprio", async (_n, make) => {
    const { container } = render(await make());
    const root = container.firstElementChild as HTMLElement;
    const all = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];
    const pageWidth = all.filter((e) => e.classList.contains("page-width"));
    expect(pageWidth.length).toBeGreaterThan(0);
    // a raiz (fundo da seção) não define largura máxima nem frações; só page-width limita o conteúdo
    expect(root.className).not.toMatch(/\bmax-w-(?!\[)|\bw-\d+\/\d+\b/);
    expect(container.innerHTML).not.toMatch(/content-fit|site-container|site-gutter|max-w-site/);
  });

  it("hero: imagem única w-full dentro de page-width, aspect 11/6 constante, sem altura de janela; sizes coerente com o teto", async () => {
    const { container } = render(await HomeHero());
    const slot = container.querySelector("[data-testid='slot']") as HTMLElement;
    expect(slot.closest(".page-width")).not.toBeNull();
    expect(slot.className).toContain("aspect-[11/6]");
    expect(slot.className).toContain("w-full");
    expect(slot.className).not.toMatch(/max-w-|max-h-|svh|content-fit|md:aspect|lg:aspect/);
    expect(slot).toHaveAttribute("data-sizes", "(min-width: 1440px) 1400px, 100vw");
  });

  it("nenhuma medida em px nas classes de layout da home (rem, cqw, %, escala Tailwind)", () => {
    // Exceções antigas e fora do escopo: app-header (h-[3.625rem]) não está nesta pasta. Sombras em rem.
    const dir = path.resolve(import.meta.dirname, "../src/components/home");
    for (const file of readdirSync(dir)) {
      const src = readFileSync(path.resolve(dir, file), "utf8");
      expect(src, file).not.toMatch(/\[-?[\d.]+px\]/);
    }
  });

  it("proibições nos componentes da home e das seções (svh, max-h, clamp, fontes/larguras xl/2xl, frações, content-fit)", () => {
    const dirs = ["../src/components/home", "../src/components/sections"];
    const forbidden = /svh|\bvh\b|max-h-\[|clamp\(|content-fit|\b(2xl|xl):(text-|w-|max-w|gap|py|pt|pb)|\blg:w-\d+\/\d+|aspect-\[(21\/9|16\/7)\]|min-width: 1792px/;
    for (const dir of dirs) {
      for (const file of readdirSync(path.resolve(import.meta.dirname, dir))) {
        const src = readFileSync(path.resolve(import.meta.dirname, dir, file), "utf8");
        expect(src, `${dir}/${file}`).not.toMatch(forbidden);
      }
    }
  });

  it("tipografia com teto: hero text-3xl, títulos de seção text-4xl, card text-lg, destaque text-3xl", () => {
    const read = (f: string) => readFileSync(path.resolve(import.meta.dirname, f), "utf8");
    expect(read("../src/components/home/home-hero.tsx")).toMatch(/lg:text-3xl/);
    expect(read("../src/components/home/recent-stories.tsx")).toMatch(/text-3xl sm:text-4xl/);
    expect(read("../src/components/home/story-card.tsx")).toMatch(/md:text-lg/);
    expect(read("../src/components/home/home-feature.tsx")).toMatch(/md:text-3xl/);
  });

  it("destaque: medida de leitura limitada só no texto (ch)", async () => {
    const { container } = render(await HomeFeature());
    expect(container.querySelector("p.max-w-\\[40ch\\]")).not.toBeNull();
  });
});

describe("espaçamentos do modelo aprovado (base mobile, escala Tailwind)", () => {
  it("hero, banner, histórias, destaque, faixa amarela e rodapé", async () => {
    const hero = render(await HomeHero()).container;
    expect(hero.querySelector(".page-width")!.className).toMatch(/\bpt-0\b.*\bpb-10\b/);
    expect(hero.querySelector(".space-y-1")).not.toBeNull();

    const banner = render(await HomeBanner()).container;
    expect(banner.querySelector("figure")!.className).toMatch(/\bpt-5\b.*\bpb-0\b/);
    expect(banner.querySelector("figcaption")!.className).toContain("mt-1");

    const stories = render(await RecentStories({ stories: [] })).container;
    expect(stories.querySelector("section")!.className).toMatch(/\bpt-5\b.*\bpb-12\b/);

    const feature = render(await HomeFeature()).container;
    expect(feature.querySelector("section")!.className).toMatch(/\bpt-0\b.*\bpb-6\b/);
    expect(feature.querySelector(".page-width")!.className).toContain("gap-5");

    const band = render(await NewsletterBand()).container;
    expect(band.querySelector(".page-width")!.className).toContain("py-3");

    const footer = render(await HomeFooter()).container;
    expect(footer.querySelector("footer")!.className).toContain("py-2");
    expect(footer.querySelector("footer")!.className).toContain("page-width");
  });
});
