// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
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
  it("uma ilustração única (sem carrossel, controles nem overlay) acima do título e do subtítulo", async () => {
    render(await HomeHero());
    expect(screen.queryByRole("region")).toBeNull();
    expect(screen.queryAllByTestId("carousel-overlay")).toHaveLength(0);
    expect(screen.queryByRole("button")).toBeNull(); // sem setas/bolinhas/pausa
    const slots = screen.getAllByTestId("slot");
    expect(slots).toHaveLength(1);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("BEM-VINDO a um MAR de ENCONTROS");
    expect(slots[0].compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(h1.parentElement).toHaveClass("space-y-1");
    expect(screen.getByText("SENTIR · Navegar · CONTEMPLar")).toHaveClass("text-purple");
  });
});

describe("HomeBanner", () => {
  it("faixa 2:1 no mobile e 3:1 em md+, com legenda e sem carrossel", async () => {
    const { container } = render(await HomeBanner());
    expect(container.querySelector("figure")).not.toBeNull();
    expect(container.querySelector("figcaption")).toHaveTextContent("Mural de exemplo · Museu, Cidade, 2024");
    const slot = container.querySelector("[data-testid='slot']")!;
    expect(slot).toHaveClass("aspect-[2/1]", "md:aspect-[3/1]");
    expect(screen.queryByRole("region")).toBeNull();
    expect(screen.queryAllByTestId("carousel-overlay")).toHaveLength(0);
  });
});
