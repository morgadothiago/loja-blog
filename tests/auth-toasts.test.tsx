// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ pathname: "/login" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }), usePathname: () => state.pathname }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
const actions = vi.hoisted(() => ({ login: vi.fn(), register: vi.fn() }));
vi.mock("@/actions/auth", () => actions);

import { FlashToast } from "@/components/flash-toast";
import { LanguageProvider } from "@/contexts/language-context";
import { dictionaries } from "@/lib/i18n";
import { LoginForm } from "../src/app/(auth)/login/login-form";
import { RegisterForm } from "../src/app/(auth)/cadastro/register-form";

const wrap = (ui: React.ReactNode, locale: "pt-BR" | "en" | "es" = "pt-BR") =>
  render(<LanguageProvider initialLocale={locale}>{ui}</LanguageProvider>);

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
  actions.login.mockReset();
  actions.register.mockReset();
  state.pathname = "/login";
});
afterEach(() => {
  document.cookie = "flash=; path=/; max-age=0";
});

describe("FlashToast (sucesso sobrevive ao redirect)", () => {
  it.each([
    ["login", "pt-BR"],
    ["register", "pt-BR"],
    ["logout", "pt-BR"],
    ["login", "en"],
    ["logout", "es"],
  ] as const)("cookie flash=%s em %s mostra o toast traduzido uma vez e limpa o cookie", (kind, locale) => {
    document.cookie = `flash=${kind}; path=/`;
    wrap(<FlashToast />, locale);
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith(dictionaries[locale][`flash.${kind}`]);
    expect(document.cookie).not.toContain("flash=");
  });

  it("mensagens exatas pedidas", () => {
    expect(dictionaries["pt-BR"]["flash.login"]).toBe("Login realizado.");
    expect(dictionaries["pt-BR"]["flash.logout"]).toBe("Você saiu da sua conta.");
  });

  it("sem cookie ou com valor desconhecido/hostil não mostra nada", () => {
    wrap(<FlashToast />);
    document.cookie = "flash=<script>; path=/";
    wrap(<FlashToast />);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("redirect sem recarregar: o toast aparece ao mudar de rota", () => {
    const { rerender } = wrap(<FlashToast />);
    expect(toast.success).not.toHaveBeenCalled();
    document.cookie = "flash=login; path=/";
    state.pathname = "/destino";
    rerender(
      <LanguageProvider initialLocale="pt-BR">
        <FlashToast />
      </LanguageProvider>,
    );
    expect(toast.success).toHaveBeenCalledWith("Login realizado.");
  });
});

describe("LoginForm: erro com toast + aviso inline (role=alert)", () => {
  async function submit(result: unknown, locale: "pt-BR" | "en" | "es" = "pt-BR") {
    actions.login.mockImplementation(() => (result instanceof Error ? Promise.reject(result) : Promise.resolve(result)));
    const user = userEvent.setup();
    wrap(<LoginForm />, locale);
    await user.type(screen.getByLabelText(dictionaries[locale]["auth.email"]), "a@b.com");
    await user.type(screen.getByLabelText(dictionaries[locale]["auth.password"]), "errada");
    await user.click(screen.getByRole("button", { name: dictionaries[locale]["auth.login.submit"] }));
  }

  it.each([
    ["credenciais inválidas", { ok: false, error: { code: "UNAUTHENTICATED", detailCode: "INVALID_CREDENTIALS" } }, "E-mail ou senha inválidos."],
    ["conta desativada (mesma resposta)", { ok: false, error: { code: "UNAUTHENTICATED", detailCode: "INVALID_CREDENTIALS" } }, "E-mail ou senha inválidos."],
    ["rate limit", { ok: false, error: { code: "RATE_LIMITED" } }, "Muitas tentativas. Aguarde alguns minutos e tente de novo."],
    ["erro do servidor", { ok: false, error: { code: "INTERNAL" } }, dictionaries["pt-BR"]["error.INTERNAL"]],
    ["serviço indisponível", { ok: false, error: { code: "UNAVAILABLE" } }, dictionaries["pt-BR"]["error.UNAVAILABLE"]],
    ["rede (a chamada rejeita)", new TypeError("Failed to fetch"), dictionaries["pt-BR"]["error.NETWORK"]],
  ])("%s", async (_n, result, message) => {
    await submit(result);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message));
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("mensagens em en e es", async () => {
    await submit({ ok: false, error: { code: "UNAUTHENTICATED", detailCode: "INVALID_CREDENTIALS" } }, "en");
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Invalid email or password."));
  });

  it("validação do cliente não chama a action nem o toast de servidor", async () => {
    const user = userEvent.setup();
    wrap(<LoginForm />);
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(actions.login).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("envia callbackUrl seguro e sem console.error", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      actions.login.mockResolvedValue({ ok: false, error: { code: "RATE_LIMITED" } });
      const user = userEvent.setup();
      wrap(<LoginForm callbackUrl="/carrinho" />);
      await user.type(screen.getByLabelText("E-mail"), "a@b.com");
      await user.type(screen.getByLabelText("Senha"), "x");
      await user.click(screen.getByRole("button", { name: "Entrar" }));
      await waitFor(() => expect(actions.login).toHaveBeenCalledWith({ email: "a@b.com", password: "x", callbackUrl: "/carrinho" }));
      expect(error).not.toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });
});

describe("RegisterForm: erro com toast", () => {
  it("e-mail já cadastrado: erro no campo + toast", async () => {
    actions.register.mockResolvedValue({ ok: false, error: { code: "CONFLICT", detailCode: "EMAIL_TAKEN" } });
    const user = userEvent.setup();
    wrap(<RegisterForm />);
    await user.type(screen.getByLabelText("Nome"), "Ana");
    await user.type(screen.getByLabelText("E-mail"), "ana@x.com");
    await user.type(screen.getByLabelText("Senha"), "Senha@12345");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    const message = dictionaries["pt-BR"]["error.EMAIL_TAKEN"];
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("aria-invalid", "true");
  });
});
