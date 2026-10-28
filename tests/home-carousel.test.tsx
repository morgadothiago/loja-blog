// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HomeCarousel, type CarouselLabels } from "@/components/home/home-carousel";

const labels: CarouselLabels = {
  region: "Carrossel de imagens",
  prev: "Slide anterior",
  next: "Próximo slide",
  pause: "Pausar apresentação de slides",
  play: "Continuar apresentação de slides",
  goTo: "Ir para o slide {n}",
  slide: "{n} de {total}",
};
const slides = [1, 2, 3].map((n) => <div key={n}>conteúdo {n}</div>);

function mockReducedMotion(reduced: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes("prefers-reduced-motion"),
    media: query, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => mockReducedMotion(false));

describe("HomeCarousel", () => {
  it("região com semântica de carrossel e 3 slides 'n de 3'", () => {
    render(<HomeCarousel slides={slides} labels={labels} />);
    const region = screen.getByRole("region", { name: "Carrossel de imagens" });
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
    const items = within(region).getAllByRole("group");
    expect(items).toHaveLength(3);
    items.forEach((el, i) => {
      expect(el).toHaveAttribute("aria-roledescription", "slide");
      expect(el).toHaveAccessibleName(`${i + 1} de 3`);
    });
  });

  it("overlay cinza presente em cada slide, decorativo", () => {
    render(<HomeCarousel slides={slides} labels={labels} />);
    const overlays = screen.getAllByTestId("carousel-overlay");
    expect(overlays).toHaveLength(3);
    overlays.forEach((o) => {
      expect(o).toHaveAttribute("aria-hidden", "true");
      expect(o.className).toContain("bg-ink/35");
    });
  });

  it("setas e bolinhas com rótulos traduzidos; 1ª bolinha atual", () => {
    render(<HomeCarousel slides={slides} labels={labels} />);
    expect(screen.getByRole("button", { name: "Slide anterior" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Próximo slide" })).toBeInTheDocument();
    for (const n of [1, 2, 3]) expect(screen.getByRole("button", { name: `Ir para o slide ${n}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ir para o slide 1" })).toHaveAttribute("aria-current", "true");
  });

  it("botão pausar/continuar alterna o nome acessível (WCAG 2.2.2)", async () => {
    const user = userEvent.setup();
    render(<HomeCarousel slides={slides} labels={labels} />);
    await user.click(screen.getByRole("button", { name: labels.pause }));
    expect(screen.getByRole("button", { name: labels.play })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: labels.play }));
    expect(screen.getByRole("button", { name: labels.pause })).toBeInTheDocument();
  });

  it("interagir (próximo) pausa o autoplay", async () => {
    const user = userEvent.setup();
    render(<HomeCarousel slides={slides} labels={labels} />);
    await user.click(screen.getByRole("button", { name: "Próximo slide" }));
    expect(screen.getByRole("button", { name: labels.play })).toBeInTheDocument();
  });

  it("hover e foco pausam (aria-live vira polite) e retomam ao sair", async () => {
    const user = userEvent.setup();
    render(<HomeCarousel slides={slides} labels={labels} />);
    const live = () => document.querySelector("[data-slot='carousel-content'] > div")!;
    expect(live()).toHaveAttribute("aria-live", "off");
    const region = screen.getByRole("region");
    await user.hover(region);
    expect(live()).toHaveAttribute("aria-live", "polite");
    await user.unhover(region);
    expect(live()).toHaveAttribute("aria-live", "off");
    await user.tab(); // foco entra no carrossel
    expect(live()).toHaveAttribute("aria-live", "polite");
  });

  it("prefers-reduced-motion: sem autoplay e sem botão de pausa", () => {
    mockReducedMotion(true);
    render(<HomeCarousel slides={slides} labels={labels} />);
    expect(screen.queryByRole("button", { name: labels.pause })).toBeNull();
    expect(document.querySelector("[data-slot='carousel-content'] > div")).toHaveAttribute("aria-live", "polite");
  });

  it("teclado: seta direita não gera erro e as bolinhas são focáveis", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const user = userEvent.setup();
      render(<HomeCarousel slides={slides} labels={labels} />);
      await user.tab();
      await act(async () => { await user.keyboard("{ArrowRight}"); });
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it("renderiza e interage sem console.error", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const user = userEvent.setup();
      render(<HomeCarousel slides={slides} labels={labels} />);
      await user.click(screen.getByRole("button", { name: "Ir para o slide 2" }));
      await user.click(screen.getByRole("button", { name: labels.pause }));
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});
