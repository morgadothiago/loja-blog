// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { CartLink } from "@/components/home/cart-link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CartProvider } from "@/contexts/cart-context";
import { LanguageProvider } from "@/contexts/language-context";

afterEach(() => localStorage.clear());

describe("CartLink", () => {
  it("aponta para /carrinho (o servidor redireciona deslogados) e tem nome acessível", () => {
    render(<CartProvider><CartLink label="Carrinho" /></CartProvider>);
    expect(screen.getByRole("link", { name: "Carrinho" })).toHaveAttribute("href", "/carrinho");
  });

  it("variante pílula (ao lado do idioma): alvo h-11, só ícone decorativo e mesmo link", () => {
    render(<CartProvider><CartLink label="Carrinho" variant="pill" /></CartProvider>);
    const link = screen.getByRole("link", { name: "Carrinho" });
    expect(link).toHaveAttribute("href", "/carrinho");
    expect(link.className).toContain("h-11");
    expect(link.className).toContain("rounded-full");
    expect(link.querySelector("svg[aria-hidden='true']")).not.toBeNull();
  });

  it("pílula alinhada ao idioma compacto: mesma altura e forma, sem sobras da variante (twMerge)", () => {
    render(
      <LanguageProvider initialLocale="pt-BR">
        <CartProvider>
          <LanguageSwitcher compact className="h-11" />
          <CartLink label="Carrinho" variant="pill" />
        </CartProvider>
      </LanguageProvider>,
    );
    const lang = screen.getByRole("button", { name: /Idioma/ });
    const cart = screen.getByRole("link", { name: "Carrinho" });
    for (const el of [lang, cart]) {
      const classes = el.className.split(/\s+/);
      for (const c of ["h-11", "rounded-full"]) expect(classes, c).toContain(c);
      // classes da variante/tamanho que devem ter sido sobrescritas
      for (const c of ["rounded-lg", "h-8"]) expect(classes, c).not.toContain(c);
    }
    // o carrinho mantém fundo e borda; o idioma compacto não tem (decisão de design do header)
    expect(cart.className.split(/\s+/)).toEqual(expect.arrayContaining(["bg-secondary", "border-ink/30"]));
    expect(lang.className.split(/\s+/)).not.toContain("bg-secondary");
    // vazio: círculo do tamanho do alvo (w-11); com itens vira pílula (testado abaixo)
    expect(cart.className.split(/\s+/)).toContain("w-11");
  });

  it("com itens a pílula cresce (sem w-11) para caber o contador", async () => {
    localStorage.setItem(
      "cart:v1",
      JSON.stringify([{ id: "1", slug: "a", name: "A", priceCents: 100, imageUrl: null, stock: 5, quantity: 3 }]),
    );
    render(<CartProvider><CartLink label="Carrinho" variant="pill" /></CartProvider>);
    const link = await screen.findByRole("link", { name: "Carrinho (3)" });
    expect(link.className.split(/\s+/)).not.toContain("w-11");
    expect(link.className.split(/\s+/)).toContain("px-3");
  });

  it.each(["icon", "pill"] as const)("contador (%s): aria-label traduzido com a quantidade e número visível", async (variant) => {
    localStorage.setItem(
      "cart:v1",
      JSON.stringify([{ id: "1", slug: "a", name: "A", priceCents: 100, imageUrl: null, stock: 5, quantity: 2 }]),
    );
    render(<CartProvider><CartLink label="Carrinho" variant={variant} /></CartProvider>);
    const link = await screen.findByRole("link", { name: "Carrinho (2)" });
    expect(link).toHaveTextContent("2");
  });
});
