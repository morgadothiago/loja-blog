// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n-server", async () => {
  const { dictionaries } = await import("@/lib/i18n");
  return { getT: async () => ({ locale: "pt-BR", t: (k: keyof (typeof dictionaries)["pt-BR"]) => dictionaries["pt-BR"][k] }) };
});

// Componentes server assíncronos não renderizam dentro do RTL; HomeImage tem teste próprio.
vi.mock("@/components/home/home-image", () => ({
  HomeImage: ({ className }: { className?: string }) => <div data-testid="slot" className={className} />,
}));

import { HomeBanner } from "@/components/home/home-banner";
import { HomeHero } from "@/components/home/home-hero";

describe("HomeHero", () => {
  it("contém o carrossel (3 slides, overlay) acima do título e do subtítulo", async () => {
    render(await HomeHero());
    const region = screen.getByRole("region", { name: "Carrossel de imagens" });
    expect(within(region).getAllByRole("group")).toHaveLength(3);
    expect(screen.getAllByTestId("carousel-overlay")).toHaveLength(3);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("BEM-VINDO a um MAR de ENCONTROS");
    // carrossel vem antes do título na ordem do documento
    expect(region.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // título e subtítulo não ficam dentro do carrossel (nada sobre o overlay)
    expect(within(region).queryByRole("heading")).toBeNull();
    expect(h1.parentElement).toHaveClass("space-y-1");
  });
});

describe("HomeBanner", () => {
  it("faixa 3:1 com legenda e sem carrossel", async () => {
    const { container } = render(await HomeBanner());
    expect(container.querySelector("figure")).not.toBeNull();
    expect(container.querySelector("figcaption")).toHaveTextContent("Ilustração de exemplo");
    expect(container.querySelector(".aspect-\\[3\\/1\\]")).not.toBeNull();
    expect(screen.queryByRole("region")).toBeNull();
    expect(screen.queryAllByTestId("carousel-overlay")).toHaveLength(0);
  });
});
