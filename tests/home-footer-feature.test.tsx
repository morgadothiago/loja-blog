// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n-server", async () => {
  const { dictionaries } = await import("@/lib/i18n");
  return { getT: async () => ({ locale: "pt-BR", t: (k: keyof (typeof dictionaries)["pt-BR"]) => dictionaries["pt-BR"][k] }) };
});
vi.mock("@/components/home/home-image", () => ({
  HomeImage: ({ className }: { className?: string }) => <div data-testid="slot" className={className} />,
}));

import { HomeFeature } from "@/components/home/home-feature";
import { HomeFooter } from "@/components/home/home-footer";
import { dictionaries } from "@/lib/i18n";
import { SITE } from "@/lib/site";

describe("HomeFooter", () => {
  it("linha fina da referência: © + 5 itens legais como TEXTO (sem link morto) + 'Site por'; sem Loja/Blog/Carrinho nem ícones", async () => {
    const { container } = render(await HomeFooter());
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    for (const label of ["Termos", "Privacidade", "Cookies", "Contato", "Gerenciar cookies"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.queryByText("Loja")).toBeNull();
    expect(screen.queryByText("Carrinho")).toBeNull();
    expect(screen.getByText(/Site por/)).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("item com href vira link com alvo >= 44px", async () => {
    const item = SITE.footerLinks[0];
    item.href = "/termos";
    try {
      render(await HomeFooter());
      const a = screen.getByRole("link", { name: "Termos" });
      expect(a).toHaveAttribute("href", "/termos");
      expect(a).toHaveClass("min-h-11");
    } finally {
      item.href = undefined;
    }
  });
});

describe("HomeFeature", () => {
  it("rótulo roxo (contraste), texto e link 'Sobre a Elena' para /blog; ilustração menor em md+", async () => {
    render(await HomeFeature());
    expect(screen.getByText(dictionaries["pt-BR"]["home.feature.label"])).toHaveClass("text-purple");
    expect(screen.getByRole("link", { name: /Sobre a Elena/ })).toHaveAttribute("href", "/blog");
    expect(screen.getByTestId("slot")).toHaveClass("w-1/3", "md:w-1/4");
  });

  it.each(["pt-BR", "en", "es"] as const)("link do destaque sem placeholder não resolvido em %s", (l) => {
    expect(dictionaries[l]["home.feature.link"]).not.toContain("{");
  });
});
