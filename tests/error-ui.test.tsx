// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

import { DeleteButton } from "@/components/dashboard/delete-button";
import { ErrorView } from "@/components/error-view";
import { FieldMessage, FormError } from "@/components/forms/form-feedback";
import GlobalError from "@/app/global-error";
import { LanguageProvider } from "@/contexts/language-context";
import type { Result } from "@/lib/result";

const wrap = (ui: React.ReactNode, locale: "pt-BR" | "en" = "pt-BR") => render(<LanguageProvider initialLocale={locale}>{ui}</LanguageProvider>);
beforeEach(() => { toast.success.mockReset(); toast.error.mockReset(); });

describe("ErrorView / global-error", () => {
  it("mostra título, código de suporte (digest) e chama retry; sem texto técnico", async () => {
    const retry = vi.fn();
    const err = Object.assign(new Error("PrismaClientKnownRequestError: tabela User"), { digest: "abc123" });
    wrap(<ErrorView error={err} retry={retry} />);
    expect(screen.getByRole("heading", { name: "Algo deu errado" })).toHaveFocus();
    expect(screen.getByText(/Código de suporte: abc123/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Prisma|tabela/);
    await userEvent.setup().click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(retry).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Voltar ao início" })).toHaveAttribute("href", "/");
  });

  it("global-error renderiza <html>/<body> e botão de retry", async () => {
    const retry = vi.fn();
    const { container } = render(<GlobalError error={new Error("x")} retry={retry} />, { container: document.documentElement });
    expect(container.querySelector("body")).not.toBeNull();
    await userEvent.setup().click(screen.getByRole("button", { name: /Tentar de novo/ }));
    expect(retry).toHaveBeenCalled();
  });
});

describe("FormError / FieldMessage", () => {
  const bad: Result<unknown> = { ok: false, error: { code: "VALIDATION", fieldErrors: { title: "TOO_SHORT" } } };
  it("erro geral em role=alert e mensagem do campo traduzida", () => {
    wrap(<><FormError result={bad} /><FieldMessage result={bad} name="title" id="title-error" /></>, "en");
    expect(screen.getByRole("alert")).toHaveTextContent("Check the highlighted fields");
    expect(document.getElementById("title-error")).toHaveTextContent("Too short.");
  });
  it("sem erro não renderiza nada", () => {
    const { container } = wrap(<FormError result={{ ok: true, data: undefined }} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("DeleteButton (confirmação + toast)", () => {
  it("abre confirmação; cancelar não executa a ação", async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    wrap(<DeleteButton action={action} />);
    await user.click(screen.getByRole("button", { name: "Excluir" }));
    expect(await screen.findByRole("alertdialog")).toHaveTextContent("Excluir este item?");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(action).not.toHaveBeenCalled();
  });

  it("confirmar executa e mostra toast de sucesso", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true, data: undefined });
    const user = userEvent.setup();
    wrap(<DeleteButton action={action} />);
    await user.click(screen.getByRole("button", { name: "Excluir" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Excluir" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Item excluído."));
  });

  it("erro do servidor (em uso) -> toast de erro traduzido; rejeição -> mensagem de rede", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ ok: false, error: { code: "CONFLICT", detailCode: "IN_USE" } });
    wrap(<DeleteButton action={action} />);
    await user.click(screen.getByRole("button", { name: "Excluir" }));
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Excluir" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("em uso")));
  });
});

import { within } from "@testing-library/react";
