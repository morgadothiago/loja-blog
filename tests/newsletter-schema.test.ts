import { describe, expect, it } from "vitest";
import { createNewsletterSchema } from "@/lib/schemas/newsletter";
import { newsletterInputSchema } from "@/lib/schemas/newsletter.server";

const CASES: [string, boolean][] = [
  ["a@b.com", true],
  ["  Pessoa@Exemplo.COM  ", true],
  ["", false],
  ["abc", false],
  ["a@", false],
  [`${"a".repeat(250)}@b.com`, false],
];

describe("schema yup (cliente)", () => {
  const schema = createNewsletterSchema();

  it.each(CASES)("%j -> válido=%s", async (email, ok) => {
    expect(await schema.isValid({ email })).toBe(ok);
  });

  it("mensagens em pt-BR por padrão", async () => {
    await expect(schema.validate({ email: "" })).rejects.toThrow("Informe seu e-mail.");
    await expect(schema.validate({ email: "abc" })).rejects.toThrow("Digite um e-mail válido");
  });

  it("usa o idioma recebido", async () => {
    const en = createNewsletterSchema((k) => (k === "newsletter.error.required" ? "Enter your email." : k));
    await expect(en.validate({ email: "" })).rejects.toThrow("Enter your email.");
  });
});

describe("schema Zod (servidor) concorda com o do cliente", () => {
  it.each(CASES)("%j -> válido=%s", (email, ok) => {
    expect(newsletterInputSchema.safeParse({ email }).success).toBe(ok);
  });

  it("normaliza trim + lowercase", () => {
    const r = newsletterInputSchema.parse({ email: "  Pessoa@Exemplo.COM " });
    expect(r.email).toBe("pessoa@exemplo.com");
  });
});
