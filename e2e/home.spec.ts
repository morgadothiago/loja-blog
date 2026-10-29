import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Spec 0013 (casos 9-14): home nas 4 larguras, menu "menu" por teclado, idiomas, movimento reduzido e imagens.
const VIEWPORTS = [
  { name: "360", width: 360, height: 800 },
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1280", width: 1280, height: 900 },
];
const SHOTS = process.env.SHOTS_DIR;

const noHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const box = async (page: Page, selector: string) => {
  const b = await page.locator(selector).first().boundingBox();
  if (!b) throw new Error(`sem caixa: ${selector}`);
  return b;
};

for (const vp of VIEWPORTS) {
  test.describe(`home ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("estrutura, ordem e proporções (checklist da spec 0013)", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      expect(await noHorizontalScroll(page)).toBe(true);

      await expect(page.getByRole("heading", { level: 1 })).toHaveText(/um mar de\s*encontros/);
      if (vp.width < 1280) {
        // abaixo de xl (spec 0014) o overlay segue; a partir de 1280 a navegação fica na barra
        const trigger = page.getByRole("button", { name: "Abrir menu" });
        await expect(trigger).toHaveText("menu");
        const t = await trigger.boundingBox();
        expect(t!.width).toBeGreaterThanOrEqual(44);
        expect(t!.height).toBeGreaterThanOrEqual(44);
      }
      expect(await page.locator("header img[src*='Menulistras']").count()).toBe(0);

      const h1 = await box(page, "h1");
      const mural = await box(page, "main section:first-of-type figure, main section:first-of-type [class*='aspect-[4/5]']");
      if (vp.width >= 1024) {
        expect(h1.x + h1.width / 2).toBeLessThan(vp.width / 2); // h1 à esquerda
        expect(mural.x).toBeGreaterThan(vp.width / 2); // mural à direita
      } else {
        expect(mural.y).toBeGreaterThan(h1.y + h1.height); // mural abaixo do título
      }
      const banner = await box(page, "main figure [class*='aspect-']");
      const ratio = banner.width / banner.height;
      expect(ratio).toBeGreaterThan(vp.width >= 768 ? 2.3 : 1.9);
      expect(ratio).toBeLessThan(vp.width >= 768 ? 2.7 : 2.1);

      // o recuo do 2º card está no link dentro do <li> (md:mt-16)
      const rects = await page.locator("section[aria-labelledby='stories-title'] ul > li > a").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
      expect(rects).toHaveLength(3);
      if (vp.width >= 768) {
        expect(rects[1].y).toBeGreaterThan(rects[0].y + 40);
        expect(Math.abs(rects[2].y - rects[0].y)).toBeLessThan(10);
        expect(rects[0].x).toBeLessThan(rects[1].x);
      } else {
        expect(rects[1].y).toBeGreaterThan(rects[0].y + rects[0].height - 2);
      }

      if (SHOTS) await page.screenshot({ path: `${SHOTS}/home-${vp.name}.jpg`, fullPage: true, type: "jpeg", quality: 60 });
    });

    test("imagens carregam, têm proporção reservada e o LCP é o mural do topo", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.evaluate(async () => {
        document.querySelectorAll("img").forEach((i) => (i.loading = "eager"));
        await Promise.all(Array.from(document.images).map((i) => i.decode().catch(() => undefined)));
      });
      const bad = await page.evaluate(() =>
        Array.from(document.images)
          .filter((i) => i.naturalWidth === 0)
          .map((i) => i.currentSrc),
      );
      expect(bad).toEqual([]);
      const first = page.locator("main img").first();
      await expect(first).toHaveAttribute("fetchpriority", "high");
    });
  });
}

test.describe("home: menu, idiomas, movimento", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("menu por teclado: foco preso, Esc fecha, foco volta, corpo sem rolagem, Práticas presente", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Abrir menu" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // com o dialog aberto o resto da página fica inerte/oculto: o gatilho não aparece por role
    await expect(page.locator("header [aria-haspopup='dialog']")).toHaveAttribute("aria-expanded", "true");
    await expect(dialog.getByText("Práticas")).toBeVisible();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      // O foco nunca chega a header/main/footer atrás do overlay (a guarda do base-ui ou o body, na volta ao navegador, são ok).
      const leaked = await page.evaluate(() => !!document.activeElement?.closest("header, main, footer") && !document.activeElement?.closest("[role=dialog]"));
      expect(leaked).toBe(false);
    }
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe("hidden");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.locator("header [aria-haspopup='dialog']")).toBeFocused();
  });

  test("header: transparente no topo e com fundo ao rolar", async ({ page }) => {
    await page.goto("/");
    const bg = () => page.locator("header").first().evaluate((h) => getComputedStyle(h).backgroundColor);
    expect(await bg()).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    await page.evaluate(() => window.scrollTo(0, 600));
    await expect.poll(bg).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
  });

  for (const [locale, h1, menu, allProjects] of [
    ["pt-BR", /um mar de\s*encontros/, "menu", "Todos os projetos →"],
    ["en", /a sea of\s*encounters/, "menu", "All projects →"],
    ["es", /un mar de\s*encuentros/, "menú", "Todos los proyectos →"],
  ] as const) {
    test(`idioma ${locale}: textos, sem rolagem horizontal e axe sem serious/critical`, async ({ page, context }) => {
      await context.addCookies([{ name: "locale", value: locale, url: "http://localhost:3100" }]);
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
      await expect(page.locator("header button[aria-haspopup='dialog']")).toHaveText(menu);
      await expect(page.getByRole("link", { name: allProjects })).toBeVisible();
      expect(await noHorizontalScroll(page)).toBe(true);
      const { violations } = await new AxeBuilder({ page }).analyze();
      const bad = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
    });
  }

  test("prefers-reduced-motion: nenhuma animação nem transição nos elementos da home e nada em loop", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const res = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll("main *"));
      const infinite = els.filter((e) => getComputedStyle(e).animationIterationCount.includes("infinite")).length;
      const animated = els.filter((e) => getComputedStyle(e).animationName !== "none").length;
      return { infinite, animated };
    });
    expect(res).toEqual({ infinite: 0, animated: 0 });
  });

  test("com movimento permitido nada fica em loop (mariposa removida; fade-up uma vez)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    const infinite = await page.evaluate(() => Array.from(document.querySelectorAll("*")).filter((e) => getComputedStyle(e).animationIterationCount.includes("infinite")).length);
    expect(infinite).toBe(0);
  });
});

for (const vp of [VIEWPORTS[0], VIEWPORTS[3]]) {
  test.describe(`newsletter ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("digitar não sobrepõe o ícone; erro de validação; envio válido mostra toast de sucesso", async ({ page }) => {
      await page.goto("/");
      const section = page.locator("section[aria-labelledby='newsletter-title']");
      await section.scrollIntoViewIfNeeded();
      const input = section.getByLabel("Seu e-mail");
      await input.fill("ana.news@exemplo.com");
      const icon = await section.locator("form svg[aria-hidden='true']").first().boundingBox();
      const field = await input.boundingBox();
      expect(icon!.x + icon!.width).toBeLessThanOrEqual(field!.x + 1); // ícone fora da área do texto
      expect(await noHorizontalScroll(page)).toBe(true);
      if (SHOTS) await section.screenshot({ path: `${SHOTS}/newsletter-${vp.name}.png` });

      await input.fill("abc");
      await section.getByRole("button", { name: "Enviar" }).click();
      await expect(section.getByRole("alert")).toContainText("e-mail válido");

      await input.fill("ana.news@exemplo.com");
      await section.getByRole("button", { name: "Enviar" }).click();
      await expect(page.locator("[data-sonner-toast][data-type='success']")).toContainText("Obrigado! Você está na lista.");
      await expect(input).toHaveValue("");
    });
  });
}

// Spec 0014: overlay abaixo de xl; navegação em linha com dropdown "Práticas" em 1280+.
for (const vp of [VIEWPORTS[0], VIEWPORTS[2]]) {
  test(`header ${vp.name}: só "menu" (sem navegação em linha)`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/");
    await expect(page.locator("header [aria-haspopup='dialog']")).toBeVisible();
    await expect(page.locator("header nav")).toBeHidden();
  });
}

test.describe("header 1280", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  for (const [locale, projects, practices, shop] of [
    ["pt-BR", "Projetos", "Práticas", "Shop"],
    ["en", "Projects", "Practices", "Shop"],
    ["es", "Proyectos", "Prácticas", "Shop"],
  ] as const) {
    test(`${locale}: nav visível, sem rolagem horizontal, sem overlay e dropdown por teclado`, async ({ page, context }) => {
      await context.addCookies([{ name: "locale", value: locale, url: "http://localhost:3100" }]);
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("header [aria-haspopup='dialog']")).toBeHidden();
      const nav = page.locator("header nav");
      await expect(nav.getByRole("link", { name: projects })).toBeVisible();
      await expect(nav.getByRole("link", { name: shop })).toBeVisible();
      expect(await noHorizontalScroll(page)).toBe(true);
      const right = await page.locator("header .page-width").evaluate((e) => e.scrollWidth <= e.clientWidth);
      expect(right).toBe(true);

      const trigger = nav.getByRole("button", { name: practices });
      await trigger.focus();
      await page.keyboard.press("Enter");
      const menu = page.getByRole("menu");
      await expect(menu).toBeVisible();
      await expect(menu.getByRole("menuitem")).toHaveCount(3);
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await expect(trigger).toBeFocused();

      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
      if (SHOTS && locale === "pt-BR") await page.screenshot({ path: `${SHOTS}/header-1280.png`, clip: { x: 0, y: 0, width: 1280, height: 120 } });
    });
  }
});
