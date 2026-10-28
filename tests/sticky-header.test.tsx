// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

import { AppHeader } from "@/components/header/app-header";

const labels = { openMenu: "Abrir menu", closeMenu: "Fechar menu", menuTitle: "Menu", nav: "Nav" };

type Callback = (entries: { isIntersecting: boolean }[]) => void;
let callbacks: Callback[] = [];
let options: IntersectionObserverInit[] = [];
const OriginalIO = window.IntersectionObserver;

beforeEach(() => {
  callbacks = [];
  options = [];
  class FakeIO {
    constructor(cb: Callback, opts?: IntersectionObserverInit) {
      callbacks.push(cb);
      options.push(opts ?? {});
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  }
  window.IntersectionObserver = FakeIO as unknown as typeof IntersectionObserver;
  document.body.insertAdjacentHTML("beforeend", '<section id="home-hero"></section>');
});

afterEach(() => {
  window.IntersectionObserver = OriginalIO;
  document.getElementById("home-hero")?.remove();
});

const header = () => document.querySelector("header") as HTMLElement;
const scrollTo = (heroVisible: boolean) => act(() => callbacks.forEach((cb) => cb([{ isIntersecting: heroVisible }])));

describe("AppHeader fixo + troca de cor", () => {
  it("sticky top-0 com z-index abaixo do Sheet e transição respeitando reduced motion", () => {
    render(<AppHeader brand="X" items={[]} labels={labels} sticky solidAfterId="home-hero" />);
    expect(header().className).toMatch(/\bsticky\b/);
    expect(header().className).toMatch(/\btop-0\b/);
    expect(header().className).toMatch(/\bz-40\b/); // Sheet usa z-50
    expect(header().className).toContain("transition-colors");
    expect(header().className).toContain("motion-reduce:transition-none");
  });

  it("sem sticky não fixa o header (reutilizável)", () => {
    render(<AppHeader brand="X" items={[]} labels={labels} />);
    expect(header().className).not.toMatch(/\bsticky\b/);
  });

  it("começa bege (estado do hero, sem flash) e a borda já reserva espaço", () => {
    render(<AppHeader brand="X" items={[]} labels={labels} sticky solidAfterId="home-hero" />);
    expect(header().className).toContain("bg-secondary");
    expect(header().className).toContain("border-b");
    expect(header().className).not.toContain("bg-card");
  });

  it("branco (token card) com sombra ao sair do hero e volta ao bege ao rolar para cima", () => {
    render(<AppHeader brand="X" items={[]} labels={labels} sticky solidAfterId="home-hero" />);
    scrollTo(false);
    expect(header().className).toContain("bg-card");
    expect(header().className).toContain("shadow-sm");
    expect(header().className).not.toContain("bg-secondary");
    scrollTo(true);
    expect(header().className).toContain("bg-secondary");
    expect(header().className).not.toContain("bg-card");
  });

  it("página aberta já rolada: o 1º callback do observer define o estado certo", () => {
    render(<AppHeader brand="X" items={[]} labels={labels} sticky solidAfterId="home-hero" />);
    scrollTo(false);
    expect(header().className).toContain("bg-card");
  });

  it("observa com rootMargin que desconta a altura do header (59px)", () => {
    render(<AppHeader brand="X" items={[]} labels={labels} sticky solidAfterId="home-hero" />);
    expect(options.map((o) => o.rootMargin)).toContain("-59px 0px 0px 0px");
  });

  it("sem solidAfterId (ou alvo inexistente) não observa nada e fica bege", () => {
    render(<AppHeader brand="X" items={[]} labels={labels} sticky />);
    expect(options.map((o) => o.rootMargin)).not.toContain("-59px 0px 0px 0px");
    expect(header().className).toContain("bg-secondary");
  });

  it("menu abre com o header branco, sem erros", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const user = userEvent.setup();
      render(<AppHeader brand="X" items={[]} labels={labels} sticky solidAfterId="home-hero" />);
      scrollTo(false);
      await user.click(screen.getByRole("button", { name: "Abrir menu" }));
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});
