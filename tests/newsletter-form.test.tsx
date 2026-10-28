// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const subscribe = vi.fn();
vi.mock("@/actions/newsletter", () => ({ subscribeNewsletter: (v: unknown) => subscribe(v) }));

import { NewsletterForm } from "@/components/home/newsletter-form";
import { LanguageProvider } from "@/contexts/language-context";

function setup(locale: "pt-BR" | "en" = "pt-BR") {
  render(
    <LanguageProvider initialLocale={locale}>
      <NewsletterForm />
    </LanguageProvider>,
  );
  return userEvent.setup();
}

beforeEach(() => subscribe.mockReset());

describe("NewsletterForm", () => {
  it("campo com label visível e atributos de e-mail", () => {
    setup();
    const input = screen.getByLabelText("Seu e-mail");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("autocomplete", "email");
    expect(input).toHaveAttribute("inputmode", "email");
  });

  it("e-mail vazio: erro em pt-BR e a action não é chamada", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: "Inscrever-se" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Informe seu e-mail.");
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("e-mail inválido: mensagem diz como corrigir", async () => {
    const user = setup();
    await user.type(screen.getByLabelText("Seu e-mail"), "abc");
    await user.click(screen.getByRole("button", { name: "Inscrever-se" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("e-mail válido");
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("mensagens seguem o idioma ativo", async () => {
    const user = setup("en");
    await user.click(screen.getByRole("button", { name: "Subscribe" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter your email.");
  });

  it("pending: botão desabilitado; sucesso: role=status", async () => {
    let finish!: (v: { ok: true; data: undefined }) => void;
    subscribe.mockReturnValue(new Promise((r) => (finish = r)));
    const user = setup();
    await user.type(screen.getByLabelText("Seu e-mail"), "ana@exemplo.com");
    await user.click(screen.getByRole("button", { name: "Inscrever-se" }));
    expect(await screen.findByRole("button", { name: "Enviando..." })).toBeDisabled();
    finish({ ok: true, data: undefined });
    expect(await screen.findByRole("status")).toHaveTextContent("Obrigado!");
    expect(subscribe).toHaveBeenCalledWith({ email: "ana@exemplo.com", website: "" });
  });

  it("erro inesperado do servidor: mensagem genérica e permite tentar de novo", async () => {
    subscribe.mockResolvedValue({ ok: false, error: { code: "INTERNAL" } });
    const user = setup();
    await user.type(screen.getByLabelText("Seu e-mail"), "ana@exemplo.com");
    await user.click(screen.getByRole("button", { name: "Inscrever-se" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Algo deu errado do nosso lado");
    expect(screen.getByRole("button", { name: "Inscrever-se" })).toBeEnabled();
  });
});
