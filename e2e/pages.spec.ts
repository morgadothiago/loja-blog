import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Páginas da camada 2 (spec 0012) + as listas alteradas (0011). Viewports: 360, 390, 768 e 1280.
const PAGES = [
  "/projetos",
  "/projetos/projeto-exemplo-1",
  "/festivais-e-residencias",
  "/festivais-e-residencias/residencia-exemplo-1",
  "/praticas/desenho",
  "/exposicoes",
  "/contato",
  "/livros",
  "/sobre",
  "/",
];
const VIEWPORTS = [
  { name: "360", width: 360, height: 800 },
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1280", width: 1280, height: 900 },
];
const SHOTS = process.env.SHOTS_DIR; // define o diretório para gerar capturas de evidência

const slug = (p: string) => (p === "/" ? "home" : p.slice(1).replaceAll("/", "_"));
const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

for (const vp of VIEWPORTS) {
  test.describe(`viewport ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const path of PAGES) {
      test(`${path}: sem rolagem horizontal, h1 visível, axe sem serious/critical`, async ({ page }) => {
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await page.waitForLoadState("networkidle");
        expect(await noHorizontalScroll(page)).toBe(true);
        const h1 = page.locator("h1").first();
        await expect(h1).toBeVisible();

        const { violations } = await new AxeBuilder({ page }).analyze();
        const bad = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);

        if (SHOTS) await page.screenshot({ path: `${SHOTS}/${slug(path)}-${vp.name}.jpg`, fullPage: true, type: "jpeg", quality: 55 });
      });
    }
  });
}

test.describe("fluxos", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("slug inexistente: 404 dentro do layout (header e rodapé presentes)", async ({ page }) => {
    for (const path of ["/projetos/nao-existe", "/festivais-e-residencias/nao-existe", "/praticas/pintura"]) {
      // Com loading.tsx a resposta já foi enviada em streaming (status 200); o 404 aparece no conteúdo
      // e com <meta name="robots" content="noindex">, que é o que impede indexação.
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
      await expect(page.getByRole("heading", { level: 1, name: "Página não encontrada" })).toBeVisible();
      await expect(page.getByRole("contentinfo")).toBeVisible();
    }
  });

  test("lista de projetos leva ao detalhe e o detalhe volta; chips levam às práticas", async ({ page }) => {
    await page.goto("/projetos");
    await page.getByRole("link", { name: /Projeto de exemplo 1/ }).click();
    await expect(page).toHaveURL(/\/projetos\/projeto-exemplo-1$/);
    await expect(page.getByRole("heading", { level: 1, name: "Projeto de exemplo 1" })).toBeVisible();
    await page.getByRole("link", { name: "← Projetos" }).click();
    await expect(page).toHaveURL(/\/projetos$/);
    await page.getByRole("link", { name: "Cerâmica" }).click();
    await expect(page).toHaveURL(/\/praticas\/ceramica$/);
    await expect(page.getByRole("link", { name: "Cerâmica" })).toHaveAttribute("aria-current", "page");
  });

  test("idioma do cookie vale no detalhe (en)", async ({ page, context }) => {
    await context.addCookies([{ name: "locale", value: "en", url: "http://localhost:3100" }]);
    await page.goto("/projetos/projeto-exemplo-1");
    await expect(page.getByRole("heading", { level: 1, name: "Sample project 1" })).toBeVisible();
    await expect(page.getByRole("link", { name: "← Projects" })).toBeVisible();
  });

  test("rotas protegidas: /dashboard/mensagens anônimo vai para o login", async ({ page }) => {
    await page.goto("/dashboard/mensagens");
    await expect(page).toHaveURL(/\/login/);
  });

  test("contato: erro por campo preserva o digitado; envio válido mostra sucesso e limpa", async ({ page }) => {
    // IP único por execução: o rate limit (5 por 15 min) não acumula entre rodadas.
    const ip = `198.51.100.${Math.floor(Math.random() * 250) + 1}`;
    await page.setExtraHTTPHeaders({ "x-forwarded-for": ip });
    await page.goto("/contato");
    await page.getByLabel("Seu nome").fill("Ana E2E");
    await page.getByLabel("Seu e-mail").fill("sem-arroba");
    await page.getByLabel("Sua mensagem").fill("Mensagem de teste automatizado");
    await page.getByRole("button", { name: "Enviar mensagem" }).click();
    await expect(page.locator("form [role=alert]")).toContainText("Confira os campos");
    await expect(page.getByLabel("Seu e-mail")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Seu nome")).toHaveValue("Ana E2E");

    await page.getByLabel("Seu e-mail").fill("ana.e2e@exemplo.com");
    await page.getByRole("button", { name: "Enviar mensagem" }).click();
    await expect(page.getByRole("status")).toContainText("Mensagem enviada");
    await expect(page.getByLabel("Seu nome")).toHaveValue("");
  });

  test("menu mobile abre com o conteúdo e fecha com Esc", async ({ page }) => {
    await page.goto("/projetos");
    await page.getByRole("button", { name: "Abrir menu" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
