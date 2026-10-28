// @vitest-environment jsdom
import path from "node:path";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n-server", async () => {
  const { dictionaries } = await import("@/lib/i18n");
  return { getT: async () => ({ locale: "pt-BR", t: (k: keyof (typeof dictionaries)["pt-BR"]) => dictionaries["pt-BR"][k] }) };
});

import { HomeFooter } from "@/components/home/home-footer";
import { HomeImage } from "@/components/home/home-image";
import { dictionaries } from "@/lib/i18n";
import { HOME_IMAGES } from "@/lib/home-images";
import { SITE } from "@/lib/site";

describe("HomeImage (slots)", () => {
  it("sem src: placeholder SVG decorativo", async () => {
    const { container } = render(await HomeImage({ slot: {}, placeholder: "hero", sizes: "100vw", className: "x" }));
    expect(container.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("com src: <img> com alt traduzido do altKey", async () => {
    const { container } = render(
      await HomeImage({ slot: { src: { src: "/images/home/hero.jpg", width: 100, height: 50 }, altKey: "home.carousel.1.alt" }, placeholder: "hero", sizes: "100vw" }),
    );
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("alt", dictionaries["pt-BR"]["home.carousel.1.alt"]);
    expect(img.getAttribute("src")).toContain("hero.jpg");
  });

  it("com src e sem altKey: decorativa (alt vazio)", async () => {
    const { container } = render(await HomeImage({ slot: { src: { src: "/images/home/a.jpg", width: 10, height: 10 } }, placeholder: "side", sizes: "10vw" }));
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

  it("mostra © ano + nome do site configurável; itens legais sem href são texto (sem link morto)", async () => {
    const { container } = render(await HomeFooter());
    expect(container.textContent).toContain(`© ${new Date().getFullYear()} ${SITE.name}`);
    expect(container.textContent).toMatch(/Termos.*Privacidade.*Cookies.*Contato.*Gerenciar cookies/);
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(container.textContent).toContain("Site por");
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

const ROOT = path.resolve(import.meta.dirname, "..");
const dims = async (file: string) => {
  const sharp = (await import("sharp")).default;
  const { width, height } = await sharp(path.join(ROOT, "src/assets/About", file)).metadata();
  return { width, height };
};

describe("imagens ORIGINAIS do cliente via import estático (src/assets)", () => {
  it("slots usam o original: dimensões do import = dimensões reais do arquivo (sem redimensionar)", async () => {
    const whale = HOME_IMAGES.heroCarousel[0].src as { src: string; width: number; height: number };
    expect([whale.width, whale.height]).toEqual([2631, 905]);
    expect(await dims("Whale.png")).toEqual({ width: 2631, height: 905 });

    const feature = HOME_IMAGES.feature.src as { width: number; height: number };
    expect([feature.width, feature.height]).toEqual([1688, 2300]);
    expect(await dims("Characters_2.png")).toEqual({ width: 1688, height: 2300 });
    expect(HOME_IMAGES.feature.fit).toBe("contain");
    expect(HOME_IMAGES.feature.crop).toBeUndefined(); // sem recorte

    const banjo = HOME_IMAGES.newsletterRight.src as { width: number; height: number };
    expect([banjo.width, banjo.height]).toEqual([1597, 2300]);
    expect(await dims("Characters_2(1).png")).toEqual({ width: 1597, height: 2300 });
  });

  it("hero: slide 1 = cachalote; os outros 2 seguem placeholders; alt traduzido", () => {
    expect(HOME_IMAGES.heroCarousel[0].src).toBeTruthy();
    expect(HOME_IMAGES.heroCarousel[1].src).toBeUndefined();
    expect(HOME_IMAGES.heroCarousel[2].src).toBeUndefined();
    for (const l of ["pt-BR", "en", "es"] as const) expect(dictionaries[l]["home.carousel.1.alt"]).toMatch(/cachalote|sperm whale/i);
  });

  it("destaque: alt descritivo nas 3 línguas e <img> object-contain com o arquivo original", async () => {
    for (const l of ["pt-BR", "en", "es"] as const) expect(dictionaries[l]["home.feature.alt"]).toMatch(/flor amarela|yellow flower|flor amarilla/i);
    const { container } = render(await HomeImage({ slot: HOME_IMAGES.feature, placeholder: "feature", sizes: "100vw" }));
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("alt", dictionaries["pt-BR"]["home.feature.alt"]);
    expect(decodeURIComponent(img.getAttribute("src")!)).toContain("Characters_2.png");
    expect(img.className).toContain("object-contain");
  });

  it("banjo da newsletter: recorte por CSS da região da arte (pixels originais), proporção do arquivo, sem arquivo novo", async () => {
    const { crop } = HOME_IMAGES.newsletterRight;
    expect(crop).toEqual({ x: 85, y: 331, width: 1297, height: 1459 });
    expect(crop!.width / crop!.height).toBeCloseTo(8 / 9, 3); // = aspect-[8/9] do componente
    const { container } = render(await HomeImage({ slot: HOME_IMAGES.newsletterRight, placeholder: "side-b", sizes: "160px", className: "aspect-[8/9] w-12" }));
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("alt", dictionaries["pt-BR"]["newsletter.art.alt"]);
    expect(decodeURIComponent(img.getAttribute("src")!)).toContain("Characters_2(1).png");
    // largura = largura do original / largura do recorte; deslocamento em % do recorte; altura automática (sem distorcer)
    expect(parseFloat(img.style.width)).toBeCloseTo((1597 / 1297) * 100, 1);
    expect(img.style.height).toBe("auto");
    expect(parseFloat(img.style.left)).toBeCloseTo((-85 / 1297) * 100, 1);
    expect(parseFloat(img.style.top)).toBeCloseTo((-331 / 1459) * 100, 1);
    for (const l of ["pt-BR", "en", "es"] as const) expect(dictionaries[l]["newsletter.art.alt"]).toMatch(/banjo/i);
  });

  it("nada de cópias em public/ nem versões reduzidas geradas das imagens do cliente", async () => {
    const { existsSync, readdirSync } = await import("node:fs");
    const root = ROOT + "/";
    expect(existsSync(root + "public/images/menu")).toBe(false);
    expect(existsSync(root + "public/images/home/newsletter-right.png")).toBe(false);
    expect(existsSync(root + "public/images/home/feature.png")).toBe(false);
    // únicos arquivos gerados: os 2 recortes (mesmos pixels) de Iconesredes.png
    expect(readdirSync(root + "src/assets/generated").sort()).toEqual(["facebook.png", "instagram.png"]);
  });

  it("recortes sociais: mesmos pixels de Iconesredes.png (sem reduzir resolução) e pretos", async () => {
    const sharp = (await import("sharp")).default;
    const root = path.join(ROOT, "src/assets") + "/";
    const src = await sharp(root + "About/Iconesredes.png").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (const [name, left, top, width, height] of [["instagram", 31, 30, 104, 102], ["facebook", 189, 25, 72, 131]] as const) {
      const out = await sharp(root + `generated/${name}.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      expect([out.info.width, out.info.height]).toEqual([width, height]);
      // todos os pixels iguais aos do original na mesma região
      let diff = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const o = ((y + top) * src.info.width + (x + left)) * 4;
          const c = (y * width + x) * 4;
          for (let k = 0; k < 4; k++) if (src.data[o + k] !== out.data[c + k]) diff++;
        }
      }
      expect(diff, name).toBe(0);
    }
  });
});
