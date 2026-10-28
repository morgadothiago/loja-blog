// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n-server", async () => {
  const { dictionaries } = await import("@/lib/i18n");
  return { getT: async () => ({ locale: "pt-BR", t: (k: keyof (typeof dictionaries)["pt-BR"]) => dictionaries["pt-BR"][k] }) };
});

import { HomeFooter } from "@/components/home/home-footer";
import { HomeImage } from "@/components/home/home-image";
import { dictionaries } from "@/lib/i18n";
import { HOME_IMAGES, SITE } from "@/lib/site";

describe("HomeImage (slots)", () => {
  it("sem src: placeholder SVG decorativo", async () => {
    const { container } = render(await HomeImage({ slot: {}, placeholder: "hero", sizes: "100vw", className: "x" }));
    expect(container.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("com src: <img> com alt traduzido do altKey", async () => {
    const { container } = render(
      await HomeImage({ slot: { src: "/images/home/hero.jpg", altKey: "home.carousel.1.alt" }, placeholder: "hero", sizes: "100vw" }),
    );
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("alt", dictionaries["pt-BR"]["home.carousel.1.alt"]);
    expect(img.getAttribute("src")).toContain("hero.jpg");
  });

  it("com src e sem altKey: decorativa (alt vazio)", async () => {
    const { container } = render(await HomeImage({ slot: { src: "/images/home/a.jpg" }, placeholder: "side", sizes: "10vw" }));
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("todos os slots do mapa existem e hero/banner/destaque têm alt traduzido nas 3 línguas", () => {
    expect(Object.keys(HOME_IMAGES).sort()).toEqual(["banner", "feature", "heroCarousel", "newsletterLeft", "newsletterRight", "stories"]);
    expect(HOME_IMAGES.stories).toHaveLength(3);
    expect(HOME_IMAGES.heroCarousel).toHaveLength(3);
    for (const l of ["pt-BR", "en", "es"] as const) {
      for (const k of ["home.banner.alt", "home.carousel.1.alt", "home.carousel.2.alt", "home.carousel.3.alt", "home.feature.alt"] as const) expect(dictionaries[l][k].length).toBeGreaterThan(5);
    }
  });
});

describe("HomeFooter", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("mostra © ano + nome do site configurável e não exibe links legais sem href", async () => {
    const { container } = render(await HomeFooter());
    expect(container.textContent).toContain(`© ${new Date().getFullYear()} ${SITE.name}`);
    expect(container.textContent).not.toMatch(/Termos|Privacidade|Gerenciar cookies/);
    expect(container.textContent).not.toContain("Site por");
  });

  it("itens legais e crédito aparecem quando configurados", async () => {
    const saved = { links: SITE.footerLinks.map((l) => ({ ...l })), credit: SITE.credit };
    SITE.footerLinks[0].href = "/termos";
    SITE.credit = { name: "Studio X", href: "https://example.com" };
    try {
      const { container } = render(await HomeFooter());
      expect(container.querySelector("a[href='/termos']")).toHaveTextContent("Termos");
      expect(container.textContent).toContain("Site por");
      expect(container.querySelector("a[href='https://example.com']")).toHaveAttribute("rel", "noopener noreferrer");
    } finally {
      SITE.footerLinks.forEach((l, i) => (l.href = saved.links[i].href));
      SITE.credit = saved.credit;
    }
  });
});

import nextConfig from "../next.config";

describe("HomeImage: qualidade e foco do recorte", () => {
  it("next.config libera a qualidade 85 usada nos slots (Next 16 coage valores fora da lista)", () => {
    expect(nextConfig.images?.qualities).toEqual(expect.arrayContaining([75, 85]));
  });

  it("aplica object-position do slot e qualidade 85 por padrão; prioridade só quando eager", async () => {
    const slot = { src: "/images/home/a.jpg", position: "50% 30%" };
    const normal = render(await HomeImage({ slot, placeholder: "hero", sizes: "100vw" }));
    const img = normal.container.querySelector("img")!;
    expect(img.style.objectPosition).toBe("50% 30%");
    expect(img.getAttribute("fetchpriority")).toBeNull();
    expect(img.getAttribute("sizes")).toBe("100vw");
    const first = render(await HomeImage({ slot, placeholder: "hero", sizes: "100vw", eager: true }));
    expect(first.container.querySelector("img")!.getAttribute("fetchpriority")).toBe("high");
  });
});
