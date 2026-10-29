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
import { HomeActivism } from "@/components/home/home-activism";
import { HomeFooter } from "@/components/home/home-footer";
import { HomeIntro } from "@/components/home/home-intro";
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
    ["intro", () => HomeIntro()],
    ["banner", () => HomeBanner()],
    ["histórias", () => RecentStories()],
    ["ativismo", () => HomeActivism()],
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

  it("intro: mural dentro de page-width, proporção 4:5 reservada e sem altura de janela", async () => {
    const { container } = render(await HomeIntro());
    const slot = container.querySelector("[data-testid='slot']") as HTMLElement;
    expect(slot.closest(".page-width")).not.toBeNull();
    expect(slot.className).toContain("aspect-[4/5]");
    expect(slot.className).not.toMatch(/svh|vh|max-h-/);
  });

  it("nenhuma medida em px nas classes de layout da home (rem, cqw, %, escala Tailwind)", () => {
    // Exceções antigas e fora do escopo: app-header (h-[3.625rem]) não está nesta pasta. Sombras em rem.
    const dir = path.resolve(import.meta.dirname, "../src/components/home");
    for (const file of readdirSync(dir)) {
      const src = readFileSync(path.resolve(dir, file), "utf8");
      expect(src, file).not.toMatch(/\[-?[\d.]+px\]/);
    }
  });

  it("proibições nos componentes da home e das seções (svh, max-h, fontes/larguras xl/2xl, frações, content-fit)", () => {
    const dirs = ["../src/components/home", "../src/components/sections"];
    const forbidden = /svh|\bvh\b|max-h-\[|content-fit|\b(2xl|xl):(text-|w-|max-w|gap|py|pt|pb)|\blg:w-\d+\/\d+|aspect-\[(21\/9|16\/7)\]|min-width: 1792px/;
    for (const dir of dirs) {
      for (const file of readdirSync(path.resolve(import.meta.dirname, dir))) {
        const src = readFileSync(path.resolve(import.meta.dirname, dir, file), "utf8");
        expect(src, `${dir}/${file}`).not.toMatch(forbidden);
      }
    }
  });

  it("tipografia (0013): h1 em clamp() com teto de 8.5rem, títulos de seção 4xl/6xl, card 2xl, frase 3xl/4xl", () => {
    const read = (f: string) => readFileSync(path.resolve(import.meta.dirname, f), "utf8");
    expect(read("../src/components/home/home-intro.tsx")).toMatch(/lg:text-\[clamp\(4\.5rem,9vw,8\.5rem\)\]/);
    expect(read("../src/components/home/recent-stories.tsx")).toMatch(/text-4xl md:text-6xl/);
    expect(read("../src/components/home/story-card.tsx")).toMatch(/text-2xl/);
    expect(read("../src/components/home/home-activism.tsx")).toMatch(/text-3xl leading-snug md:text-4xl/);
  });
});

describe("ritmo vertical da 0013 (escala Tailwind, em rem)", () => {
  it("seções separadas por mt-20/28 (histórias) e mt-24/32 (ativismo); rodapé com borda superior e page-width", async () => {
    const stories = render(await RecentStories()).container;
    expect(stories.querySelector("section")!.className).toMatch(/\bmt-20\b.*\bmd:mt-28\b/);
    const act = render(await HomeActivism()).container;
    expect(act.querySelector("section")!.className).toMatch(/\bmt-24\b.*\bmd:mt-32\b/);
    const band = render(await NewsletterBand()).container;
    expect(band.querySelector(".page-width")!.className).toContain("py-3");
    const footer = render(await HomeFooter()).container;
    expect(footer.querySelector("footer")!.className).toContain("border-t");
    expect(footer.querySelector(".page-width")).not.toBeNull();
  });
});
