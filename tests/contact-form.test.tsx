// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Result } from "@/lib/result";

const send = vi.hoisted(() => vi.fn());
vi.mock("@/actions/contact", () => ({ sendContactMessage: send }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ContactForm } from "@/components/contact/contact-form";
import { LanguageProvider } from "@/contexts/language-context";

type Locale = "pt-BR" | "en" | "es";
function setup(locale: Locale = "pt-BR") {
  render(
    <LanguageProvider initialLocale={locale}>
      <ContactForm />
    </LanguageProvider>,
  );
  return userEvent.setup();
}
const fill = async (user: ReturnType<typeof userEvent.setup>, labels: [string, string, string]) => {
  await user.type(screen.getByLabelText(labels[0]), "Ana");
  await user.type(screen.getByLabelText(labels[1]), "ana@exemplo.com");
  await user.type(screen.getByLabelText(labels[2]), "Olá!");
};

beforeEach(() => send.mockReset());

describe("ContactForm", () => {
  it.each([
    ["pt-BR", ["Seu nome", "Seu e-mail", "Sua mensagem"], "Enviar mensagem"],
    ["en", ["Your name", "Your email", "Your message"], "Send message"],
    ["es", ["Tu nombre", "Tu correo", "Tu mensaje"], "Enviar mensaje"],
  ] as const)("%s: labels visíveis associados, autocomplete/inputmode e limites", (locale, labels, submit) => {
    setup(locale);
    expect(screen.getByLabelText(labels[0])).toHaveAttribute("autocomplete", "name");
    const email = screen.getByLabelText(labels[1]);
    expect(email).toHaveAttribute("type", "email");
    expect(email).toHaveAttribute("autocomplete", "email");
    expect(email).toHaveAttribute("inputmode", "email");
    expect(screen.getByLabelText(labels[2])).toHaveAttribute("maxlength", "1000");
    expect(screen.getByRole("button", { name: submit })).toBeEnabled();
  });

  it("honeypot fora do teclado e escondido de leitores de tela", () => {
    const { container } = render(
      <LanguageProvider initialLocale="pt-BR">
        <ContactForm />
      </LanguageProvider>,
    );
    const trap = container.querySelector("input[name='website']")!;
    expect(trap).toHaveAttribute("tabindex", "-1");
    expect(trap.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("erro por campo: mensagem junto ao campo, aria-invalid/describedby e o texto digitado é preservado", async () => {
    send.mockResolvedValue({
      ok: false,
      error: { code: "VALIDATION", fieldErrors: { email: "INVALID" } },
    } satisfies Result<void>);
    const user = setup();
    await fill(user, ["Seu nome", "Seu e-mail", "Sua mensagem"]);
    await user.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    const email = await screen.findByLabelText("Seu e-mail");
    await waitFor(() => expect(email).toHaveAttribute("aria-invalid", "true"));
    const describedBy = email.getAttribute("aria-describedby")!;
    expect(document.getElementById(describedBy)).toHaveTextContent("Valor inválido.");
    expect(screen.getByRole("alert")).toHaveTextContent("Confira os campos destacados");
    expect(screen.getByLabelText("Seu nome")).toHaveValue("Ana");
    expect(email).toHaveValue("ana@exemplo.com");
    expect(screen.getByLabelText("Sua mensagem")).toHaveValue("Olá!");
  });

  it("pending: botão desabilitado com texto 'Enviando...'; depois, sucesso anunciado e campos limpos", async () => {
    let resolve!: (r: Result<void>) => void;
    send.mockReturnValue(new Promise<Result<void>>((r) => (resolve = r)));
    const user = setup("en");
    await fill(user, ["Your name", "Your email", "Your message"]);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    const busy = await screen.findByRole("button", { name: "Sending..." });
    expect(busy).toBeDisabled();
    resolve({ ok: true, data: undefined });

    expect(await screen.findByRole("status")).toHaveTextContent("Message sent. Thank you for writing!");
    expect(screen.getByLabelText("Your name")).toHaveValue("");
    expect(screen.getByLabelText("Your message")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
    // envia os campos normais e o honeypot vazio
    const data = send.mock.calls[0][1] as FormData;
    expect(data.get("name")).toBe("Ana");
    expect(data.get("website")).toBe("");
  });

  it("rate limit: mensagem geral traduzida, sem texto técnico", async () => {
    send.mockResolvedValue({ ok: false, error: { code: "RATE_LIMITED", detailCode: "CONTACT_RATE_LIMITED" } } satisfies Result<void>);
    const user = setup("es");
    await fill(user, ["Tu nombre", "Tu correo", "Tu mensaje"]);
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Demasiados intentos/i);
  });
});
