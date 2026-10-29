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

import { HomeActivism } from "@/components/home/home-activism";
import { HomeFooter } from "@/components/home/home-footer";
import { dictionaries } from "@/lib/i18n";
import { SITE } from "@/lib/site";

describe("HomeFooter (spec 0013, ref-4)", () => {
  it("tagline, © ano + nome do site; sem redes configuradas só aparecem links com href (Contato), sem link morto", async () => {
    const { container } = render(await HomeFooter());
    expect(container.textContent).toContain("arte é vida");
    expect(container.textContent).toContain(`© ${new Date().getFullYear()} ${SITE.name}`);
    expect(container.textContent).not.toMatch(/Instagram|Facebook|Termos|Privacidade|Gerenciar cookies/);
    const anchors = Array.from(container.querySelectorAll("a"));
    expect(anchors.map((a) => a.getAttribute("href"))).toEqual(["/contato"]);
    expect(anchors[0]).toHaveClass("min-h-11");
    expect(container.querySelector("footer")).toHaveClass("border-t");
    expect(container.querySelector("img")).toBeNull();
  });

  it("redes e crédito aparecem quando configurados; externos com rel seguro; legais ganham link com href", async () => {
    const saved = { links: SITE.footerLinks.map((l) => ({ ...l })), credit: SITE.credit, social: { ...SITE.social } };
    SITE.footerLinks[0].href = "/termos";
    SITE.credit = { name: "Studio X", href: "https://example.com" };
    SITE.social.instagram = "https://instagram.example/x";
    SITE.social.facebook = "https://facebook.example/x";
    try {
      const { container } = render(await HomeFooter());
      expect(container.querySelector("a[href='/termos']")).toHaveTextContent("Termos");
      for (const url of ["https://instagram.example/x", "https://facebook.example/x", "https://example.com"]) {
        expect(container.querySelector(`a[href='${url}']`)).toHaveAttribute("rel", "noopener noreferrer");
      }
      expect(container.textContent).toContain("Site por");
    } finally {
      SITE.footerLinks.forEach((l, i) => (l.href = saved.links[i].href));
      SITE.credit = saved.credit;
      SITE.social = saved.social;
    }
  });

  it("SITE.social segue vazio: redes só serão ativadas com confirmação do humano (decisão 4)", () => {
    expect(SITE.social.instagram).toBeUndefined();
    expect(SITE.social.facebook).toBeUndefined();
  });
});

describe("HomeActivism (spec 0013, ref-4)", () => {
  it("h2 'arte & ativismo' (manuscrito), frase, link /sobre e retrato com etiqueta; decorativos aria-hidden", async () => {
    const { container } = render(await HomeActivism());
    const h2 = screen.getByRole("heading", { level: 2, name: "arte & ativismo" });
    expect(h2).toHaveClass("font-hand", "text-primary");
    expect(screen.getByText(dictionaries["pt-BR"]["home.feature.text"])).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sobre a Elena →" })).toHaveAttribute("href", "/sobre");
    expect(screen.getByText("Elena")).toBeInTheDocument();
    expect(container.querySelectorAll("figure > span[aria-hidden='true']").length).toBeGreaterThanOrEqual(4);
    expect(container.querySelector("img")).toBeNull(); // sem mariposa; o retrato vem do slot (mock)
    // papéis em tokens do tema (nada de hex nem de bg-accent, que aqui é verde)
    expect(container.innerHTML).toMatch(/bg-moss\/30/);
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,6}|bg-accent/i);
  });

  it.each(["pt-BR", "en", "es"] as const)("textos de %s completos e sem placeholder não resolvido", (l) => {
    for (const k of ["home.feature.label", "home.feature.text", "home.feature.link", "home.portrait.alt", "home.portrait.tag", "footer.tagline", "menu.label", "home.mural.alt", "home.banner.alt"] as const) {
      expect(dictionaries[l][k].length, `${l} ${k}`).toBeGreaterThan(2);
      expect(dictionaries[l][k]).not.toContain("{");
    }
    expect(dictionaries[l]["home.feature.link"]).toMatch(/→$/);
  });
});

vi.mock("@/components/home/newsletter-form", () => ({ NewsletterForm: () => <form aria-label="newsletter" /> }));

describe("HomeNewsletter (abaixo de 'arte & ativismo')", () => {
  it("h2 com o título, formulário reaproveitado e contêiner cqw", async () => {
    const { HomeNewsletter } = await import("@/components/home/home-newsletter");
    const { container } = render(await HomeNewsletter());
    expect(screen.getByRole("heading", { level: 2, name: "Receba notícias mágicas!" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "newsletter" })).toBeInTheDocument();
    expect(container.innerHTML).toContain("container-type:inline-size");
    expect(container.innerHTML).not.toMatch(/bg-mustard/);
  });
});
