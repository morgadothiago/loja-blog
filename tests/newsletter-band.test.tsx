// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ locale: "pt-BR" as "pt-BR" | "en" | "es" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }), usePathname: () => "/" }));
vi.mock("@/lib/i18n-server", async () => {
  const { dictionaries } = await import("@/lib/i18n");
  return { getT: async () => ({ locale: state.locale, t: (k: keyof (typeof dictionaries)["pt-BR"]) => dictionaries[state.locale][k] }) };
});
vi.mock("@/components/home/home-image", () => ({
  HomeImage: ({ slot, placeholder, className }: { slot: object; placeholder: string; className?: string }) => (
    <div data-testid="slot" data-placeholder={placeholder} data-slot-keys={Object.keys(slot).join(",")} className={className} />
  ),
}));
const toastSuccess = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { success: (m: string) => toastSuccess(m) } }));
const subscribe = vi.hoisted(() => vi.fn());
vi.mock("@/actions/newsletter", () => ({ subscribeNewsletter: (v: unknown) => subscribe(v) }));

import { NewsletterBand } from "@/components/home/newsletter-band";
import { LanguageProvider } from "@/contexts/language-context";
import { dictionaries } from "@/lib/i18n";
import { SITE } from "@/lib/site";

async function renderBand(locale: "pt-BR" | "en" | "es" = "pt-BR") {
  state.locale = locale;
  return render(<LanguageProvider initialLocale={locale}>{await NewsletterBand()}</LanguageProvider>);
}

beforeEach(() => {
  subscribe.mockReset();
  toastSuccess.mockReset();
});
afterEach(() => {
  SITE.social.instagram = undefined;
  SITE.social.facebook = undefined;
  state.locale = "pt-BR";
});

describe("faixa da newsletter (layout aprovado)", () => {
  it("fundo mustard de ponta a ponta, conteúdo em page-width, faixa compacta", async () => {
    const { container } = await renderBand();
    const section = container.querySelector("section")!;
    expect(section.className).toContain("bg-mustard");
    expect(section.className).not.toMatch(/max-w-/);
    const inner = section.querySelector(".page-width")!;
    expect(inner.className).toContain("py-3"); // compacta no mobile
    // Em md+ a altura vem do contêiner em cqw (min-h), sem padding vertical.
    expect(inner.className).toMatch(/md:min-h-\[28cqw\]/);
    expect(inner.className).toContain("md:py-0");
    // O teto do conteúdo (--content-max) limita o contêiner das unidades cqw.
    expect(inner.parentElement!.className).toContain("max-w-(--content-max)");
  });

  it("título, campo e botão preto lado a lado (sem flex-col na linha) em todas as larguras", async () => {
    await renderBand();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Receba notícias mágicas!");
    const input = screen.getByLabelText("Seu e-mail");
    const button = screen.getByRole("button", { name: "Enviar" });
    expect(input.closest(".flex-1")!.parentElement).toBe(button.parentElement);
    const row = button.parentElement!;
    expect(row.className).toContain("flex");
    expect(row.className).not.toMatch(/flex-col|sm:flex-row/); // nunca empilha
    expect(row.className).toContain("items-center");
    expect(button.className).toContain("bg-ink");
    expect(button.className).toContain("uppercase");
    expect(button.className).toContain("rounded-full");
    expect(button.className).toContain("shrink-0");
    // A pílula (ícone + campo + botão) é o contêiner; o ícone é irmão do campo (nunca sobreposto ao texto).
    const pill = row;
    expect(pill.className).toContain("rounded-full");
    expect(pill.className).toContain("bg-paper");
    const icon = pill.querySelector("svg[aria-hidden='true']")!;
    expect(icon.parentElement).toBe(pill);
    expect(icon.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(input.className).toContain("bg-transparent");
  });

  it.each([
    ["pt-BR", "Enviar", "Digite seu e-mail"],
    ["en", "Sign up", "Enter email address"],
    ["es", "Enviar", "Escribe tu correo"],
  ] as const)("rótulo do botão e placeholder em %s", async (locale, submit, placeholder) => {
    await renderBand(locale);
    expect(screen.getByRole("button", { name: submit })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
    expect(dictionaries[locale]["newsletter.title"].length).toBeGreaterThan(5);
  });

  it("ícones Instagram/Facebook sempre visíveis: sem URL = decorativos (sem link morto); com URL = links em nova aba", async () => {
    const first = await renderBand();
    expect(screen.getByTestId("social-instagram-placeholder")).toBeInTheDocument();
    expect(screen.getByTestId("social-facebook-placeholder")).toBeInTheDocument();
    expect(first.container.querySelectorAll("section ul a")).toHaveLength(0);
    first.unmount();

    SITE.social.instagram = "https://instagram.com/exemplo";
    SITE.social.facebook = "https://facebook.com/exemplo";
    await renderBand();
    const links = within(screen.getAllByRole("list")[0]).getAllByRole("link");
    expect(links).toHaveLength(2);
    for (const a of links) {
      expect(a).toHaveAttribute("target", "_blank");
      expect(a).toHaveAttribute("rel", "noopener noreferrer");
      expect(a.className).toContain("size-11"); // alvo 44px
    }
    expect(links[0]).toHaveAccessibleName(dictionaries["pt-BR"]["social.instagram"]);
  });

  it("artes laterais são slots; a direita (banjo) não tem rotação extra e sobe acima da faixa", async () => {
    const { container } = await renderBand();
    const slots = screen.getAllByTestId("slot");
    expect(slots.map((s) => s.getAttribute("data-placeholder"))).toEqual(["side", "side-b"]);
    const right = slots[1].parentElement!;
    expect(right.className).not.toMatch(/rotate-/); // a arte já é inclinada
    expect(right.className).toContain("md:translate-y-[2cqw]"); // em md+ desce um pouco, em cqw (sem px)
    expect(right.className).toContain("z-10");
    expect(slots[1].className).toContain("aspect-[8/9]"); // proporção da arte aparada 720x810
    expect(slots[1].className).toContain("w-16"); // pequena no mobile (4rem)
    expect(container.querySelector("section")!.className).toContain("relative");
  });

  it("arte esquerda: cartão bege emoldurado 2/3 com fio rosa decorativo que sobe até a borda da faixa", async () => {
    await renderBand();
    const left = screen.getAllByTestId("slot")[0];
    expect(left.className).toContain("aspect-[2/3]");
    const card = left.parentElement!;
    expect(card.className).toContain("bg-paper");
    expect(card.className).toContain("ring-1");
    const thread = screen.getByTestId("newsletter-thread");
    expect(thread).toHaveAttribute("aria-hidden", "true");
    expect(thread.className).toContain("bg-salmon");
    expect(thread.className).toContain("flex-1");
    expect(thread.className).toContain("-mt-3"); // estende até a borda superior (compensa o py-3)
    expect(thread.parentElement!.className).toContain("self-stretch");
  });

  it("título na fonte padrão sans-serif (font-sans do tema), ~16px no mobile; conjunto central 17rem no mobile", async () => {
    await renderBand();
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2.className).toContain("font-sans");
    expect(h2.className).not.toMatch(/font-heading|font-display/);
    expect(h2.className).toContain("text-base");
    expect(h2.className).toContain("font-normal");
    expect(h2.parentElement!.className).toContain("max-w-[17rem]"); // conjunto central (largura da pílula no mobile)
  });

  it("consentimento discreto e ligado ao campo por aria-describedby; erro em role=alert fora da linha", async () => {
    await renderBand();
    const input = screen.getByLabelText("Seu e-mail");
    expect(input).toHaveAccessibleDescription(dictionaries["pt-BR"]["newsletter.consent"]);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Informe seu e-mail.");
    expect(alert.parentElement).not.toBe(screen.getByRole("button", { name: "Enviar" }).parentElement); // abaixo da linha
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(/Informe seu e-mail\./);
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("sucesso: toast de agradecimento e campo limpo, sem console.error", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      subscribe.mockResolvedValue({ ok: true, data: undefined });
      await renderBand();
      const user = userEvent.setup();
      await user.type(screen.getByLabelText("Seu e-mail"), "ana@exemplo.com");
      await user.click(screen.getByRole("button", { name: "Enviar" }));
      await vi.waitFor(() => expect(toastSuccess).toHaveBeenCalledWith(expect.stringContaining("Obrigado")));
      expect(screen.getByLabelText("Seu e-mail")).toHaveValue("");
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});
