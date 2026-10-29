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

describe("schema Zod (cliente)", () => {
  const schema = createNewsletterSchema();

  it.each(CASES)("%j -> válido=%s", (email, ok) => {
    expect(schema.safeParse({ email }).success).toBe(ok);
  });

  const first = (s: ReturnType<typeof createNewsletterSchema>, email: string) => {
    const r = s.safeParse({ email });
    return r.success ? "" : r.error.issues[0].message;
  };

  it("mensagens em pt-BR por padrão", () => {
    expect(first(schema, "")).toBe("Informe seu e-mail.");
    expect(first(schema, "abc")).toContain("Digite um e-mail válido");
  });

  it("usa o idioma recebido", () => {
    const en = createNewsletterSchema((k) => (k === "newsletter.error.required" ? "Enter your email." : k));
    expect(first(en, "")).toBe("Enter your email.");
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
