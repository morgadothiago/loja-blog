import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Spec 0011: tema do protótipo. Contraste MEDIDO (WCAG) a partir dos tokens reais de globals.css e
// regras de movimento só sob prefers-reduced-motion: no-preference.
const CSS = readFileSync(path.resolve(import.meta.dirname, "../src/app/globals.css"), "utf8");

// Bloco `:root { ... }` que contém os tokens semânticos (o primeiro com --background).
const rootBlock = CSS.split(/\n:root \{/).find((b) => b.includes("--background:")) ?? "";
const light = rootBlock.slice(0, rootBlock.indexOf("\n}"));
const dark = CSS.slice(CSS.indexOf("\n.dark {"), CSS.indexOf("\n}", CSS.indexOf("\n.dark {")));

function token(block: string, name: string): [number, number, number] {
  const m = new RegExp(`${name}:\\s*oklch\\(([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)`).exec(block);
  if (!m) throw new Error(`token ${name} não encontrado`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

// oklch -> sRGB linear (Björn Ottosson) -> luminância relativa
function luminance([L, C, h]: [number, number, number]) {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  const [r, g, bl] = rgb.map((v) => Math.min(1, Math.max(0, v)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}
function contrast(a: [number, number, number], b: [number, number, number]) {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

describe("contraste do tema (claro)", () => {
  const bg = token(light, "--background");
  it.each([
    ["foreground/background (texto)", "--foreground", "--background", 4.5],
    ["primary-foreground/primary (botão)", "--primary-foreground", "--primary", 4.5],
    ["primary/background (link e foco)", "--primary", "--background", 4.5],
    ["muted-foreground/background", "--muted-foreground", "--background", 4.5],
    ["muted-foreground/muted", "--muted-foreground", "--muted", 4.5],
    ["moss/background (acento em texto)", "--moss", "--background", 4.5],
    ["ink/salmon (faixa)", "--ink", "--salmon", 4.5],
    ["ink/mustard (faixa)", "--ink", "--mustard", 4.5],
    ["ink/secondary (faixa do hero)", "--ink", "--secondary", 4.5],
    ["ring/background (indicador de foco, UI 3:1)", "--ring", "--background", 3],
  ] as const)("%s >= %f", (_n, fg, back, min) => {
    expect(contrast(token(light, fg), token(light, back))).toBeGreaterThanOrEqual(min);
  });

  it("destructive/background (mensagem de erro)", () => {
    expect(contrast(token(light, "--destructive"), bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("contraste do tema (escuro, valores mantidos)", () => {
  it("foreground/background e primary-foreground/primary", () => {
    expect(contrast(token(dark, "--foreground"), token(dark, "--background"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(dark, "--primary-foreground"), token(dark, "--primary"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(dark, "--muted-foreground"), token(dark, "--background"))).toBeGreaterThanOrEqual(4.5);
  });
});

describe("utilitários de movimento (spec 0011 pergunta 6)", () => {
  function utility(name: string) {
    const start = CSS.indexOf(`@utility ${name} {`);
    expect(start, `@utility ${name}`).toBeGreaterThan(-1);
    // fim do bloco: primeira linha "}" na coluna 0
    return CSS.slice(start, CSS.indexOf("\n}", start) + 2);
  }

  it.each(["ink-link", "wobble", "fade-up"])("%s: transition/animation só dentro de prefers-reduced-motion: no-preference", (name) => {
    const block = utility(name);
    const withoutMotion = block.replace(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n  \}/, "");
    expect(block).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(withoutMotion).not.toMatch(/\btransition\b|\banimation\b/);
  });

  it("sem animação em loop e sem px nos utilitários e tokens novos", () => {
    expect(CSS).not.toMatch(/animation:[^;]*\binfinite\b/);
    expect(CSS).not.toMatch(/float-slow/);
    expect(CSS).not.toMatch(/\d(?:\.\d+)?px\b/);
  });
});
