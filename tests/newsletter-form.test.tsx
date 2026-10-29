// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const subscribe = vi.hoisted(() => vi.fn());
vi.mock("@/actions/newsletter", () => ({ subscribeNewsletter: (v: unknown) => subscribe(v) }));

import { toast } from "sonner";
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

beforeEach(() => {
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
  subscribe.mockReset();
  subscribe.mockResolvedValue({ ok: true, data: undefined });
});

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
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Informe seu e-mail.");
    expect(toast.success).not.toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("e-mail inválido: mensagem diz como corrigir", async () => {
    const user = setup();
    await user.type(screen.getByLabelText("Seu e-mail"), "abc");
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("e-mail válido");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("mensagens seguem o idioma ativo", async () => {
    const user = setup("en");
    await user.click(screen.getByRole("button", { name: "Sign up" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter your email.");
  });

  it("e-mail válido: mostra toast de sucesso e limpa o campo", async () => {
    const user = setup();
    await user.type(screen.getByLabelText("Seu e-mail"), "ana@exemplo.com");
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Obrigado! Você está na lista."));
    expect(subscribe).toHaveBeenCalledWith({ email: "ana@exemplo.com", website: "" });
    expect(screen.getByLabelText("Seu e-mail")).toHaveValue("");
  });

  it("falha do servidor: toast de erro, sem toast de sucesso, e o e-mail digitado é preservado", async () => {
    subscribe.mockResolvedValue({ ok: false, error: { code: "UNAVAILABLE" } });
    const user = setup();
    await user.type(screen.getByLabelText("Seu e-mail"), "ana@exemplo.com");
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Não foi possível concluir agora. Tente novamente em instantes."));
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Seu e-mail")).toHaveValue("ana@exemplo.com");
  });
});
