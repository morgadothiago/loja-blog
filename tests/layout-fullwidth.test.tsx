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

describe("home sem container de largura máxima", () => {
  it("token px-fluid = px-5 fixo (sem breakpoints) e nenhum --container-site", () => {
    const css = readFileSync(path.resolve(import.meta.dirname, "../src/app/globals.css"), "utf8");
    expect(css).toMatch(/@utility px-fluid \{\s*@apply px-5;\s*\}/);
    expect(css).not.toContain("--container-site");
  });

  it.each([
    ["hero", () => HomeHero()],
    ["banner", () => HomeBanner()],
    ["histórias", () => RecentStories({ stories: [] })],
    ["destaque", () => HomeFeature()],
    ["newsletter", () => NewsletterBand()],
    ["rodapé", () => HomeFooter()],
  ])("%s: padding lateral px-fluid e sem max-w-*/mx-auto na raiz do conteúdo", async (_n, make) => {
    const { container } = render(await make());
    const root = container.firstElementChild as HTMLElement;
    const withGutter = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))].filter((e) => e.classList.contains("px-fluid"));
    expect(withGutter.length).toBeGreaterThan(0);
    for (const el of [root, ...withGutter]) {
      expect(el.className).not.toMatch(/\bmax-w-(?!\[)|\bmx-auto\b/);
    }
    expect(container.innerHTML).not.toMatch(/\bsite-container\b|\bsite-gutter\b|max-w-site/);
  });

  it("hero: carrossel proporcional (content-fit), aspect 11/6 constante, sem altura de janela", async () => {
    const { container } = render(await HomeHero());
    const wrapper = container.querySelector("[data-slot='carousel']") as HTMLElement;
    expect(wrapper.className).toContain("content-fit");
    expect(wrapper.className).not.toMatch(/max-w-|max-h-|svh/);
    const slide = container.querySelector("[data-testid='carousel-overlay']")!.parentElement!;
    expect(slide.className).toContain("aspect-[11/6]");
    expect(slide.className).not.toMatch(/md:aspect|lg:aspect|xl:aspect|max-h-|svh/);
    expect(container.querySelector("[data-testid='slot']")).toHaveAttribute("data-sizes", "(min-width: 1536px) 67vw, (min-width: 1024px) 80vw, 100vw");
  });

  it("content-fit = 4/5 (lg) e 2/3 (2xl) da largura, sem px/rem/svh", () => {
    const css = readFileSync(path.resolve(import.meta.dirname, "../src/app/globals.css"), "utf8");
    expect(css).toMatch(/@utility content-fit \{\s*@apply mx-auto w-full lg:w-4\/5 2xl:w-2\/3;\s*\}/);
  });

  it("sem adaptação a Full HD nos componentes da home e das seções (alturas em svh, aspects ultra-largos, escala 2xl/xl, clamp)", () => {
    const dirs = ["../src/components/home", "../src/components/sections"];
    const forbidden = /svh|max-h-\[|aspect-\[(21\/9|16\/7|2\/1)\]|\b(2xl|xl):text-|\b2xl:(gap|w-|max-w)|clamp\(|min-width: 1792px/;
    for (const dir of dirs) {
      for (const file of readdirSync(path.resolve(import.meta.dirname, dir))) {
        const src = readFileSync(path.resolve(import.meta.dirname, dir, file), "utf8");
        expect(src, `${dir}/${file}`).not.toMatch(forbidden);
      }
    }
  });

  it("destaque: medida de leitura limitada só no texto (ch)", async () => {
    const { container } = render(await HomeFeature());
    expect(container.querySelector("p.max-w-\\[40ch\\]")).not.toBeNull();
  });
});

describe("espaçamentos do modelo aprovado (base mobile, escala Tailwind)", () => {
  it("hero, banner, histórias, destaque, faixa amarela e rodapé", async () => {
    const hero = render(await HomeHero()).container;
    expect(hero.querySelector(".px-fluid")!.className).toMatch(/\bpt-0\b.*\bpb-10\b/);
    expect(hero.querySelector(".space-y-1")).not.toBeNull();

    const banner = render(await HomeBanner()).container;
    expect(banner.querySelector("figure")!.className).toMatch(/\bpt-5\b.*\bpb-0\b/);
    expect(banner.querySelector("figcaption")!.className).toContain("mt-1");

    const stories = render(await RecentStories({ stories: [] })).container;
    expect(stories.querySelector("section")!.className).toMatch(/\bpt-5\b.*\bpb-8\b/);

    const feature = render(await HomeFeature()).container;
    expect(feature.querySelector("section")!.className).toMatch(/\bpt-0\b.*\bpb-6\b/);
    expect(feature.querySelector(".content-fit")!.className).toContain("gap-5");

    const band = render(await NewsletterBand()).container;
    expect(band.querySelector(".px-fluid")!.className).toContain("py-8");

    const footer = render(await HomeFooter()).container;
    expect(footer.querySelector("footer")!.className).toContain("py-2");
  });
});
