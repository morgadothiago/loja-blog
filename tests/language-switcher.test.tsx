// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { LanguageSwitcher } from "@/components/language-switcher";
import { LanguageProvider } from "@/contexts/language-context";
import { LOCALE_LABELS } from "@/lib/i18n";

function setup(locale: "pt-BR" | "en" | "es" = "pt-BR") {
  render(
    <LanguageProvider initialLocale={locale}>
      <LanguageSwitcher />
    </LanguageProvider>,
  );
  return userEvent.setup();
}

beforeEach(() => {
  refresh.mockReset();
  document.cookie = "locale=; max-age=0; path=/";
});

describe("LanguageSwitcher", () => {
  it.each([
    ["pt-BR", "Idioma: Português"],
    ["en", "Language: English"],
    ["es", "Idioma: Español"],
  ] as const)("gatilho traduzido e com nome acessível (%s)", (locale, name) => {
    setup(locale);
    expect(screen.getByRole("button", { name })).toBeInTheDocument();
  });

  it("lista exatamente 3 idiomas, nomes nativos, atual marcado", async () => {
    const user = setup("pt-BR");
    await user.click(screen.getByRole("button", { name: /Idioma/ }));
    const items = await screen.findAllByRole("menuitemradio");
    expect(items.map((i) => i.textContent)).toEqual(
      expect.arrayContaining([expect.stringContaining(LOCALE_LABELS["pt-BR"]), expect.stringContaining("English"), expect.stringContaining("Español")]),
    );
    expect(items).toHaveLength(3);
    expect(screen.getByRole("menuitemradio", { name: /Português/ })).toBeChecked();
    expect(screen.getByRole("menuitemradio", { name: /English/ })).not.toBeChecked();
  });

  it("modo compacto: bandeira + sigla, nome acessível completo", () => {
    render(
      <LanguageProvider initialLocale="en">
        <LanguageSwitcher compact />
      </LanguageProvider>,
    );
    const btn = screen.getByRole("button", { name: "Language: English" });
    expect(btn).toHaveTextContent("EN");
    expect(btn).not.toHaveTextContent("English");
  });

  it("bandeiras são decorativas (aria-hidden) no gatilho e em cada item", async () => {
    const user = setup("pt-BR");
    const trigger = screen.getByRole("button", { name: /Idioma/ });
    expect(trigger.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    await user.click(trigger);
    for (const item of await screen.findAllByRole("menuitemradio")) {
      expect(item.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    }
  });

  it("troca de idioma com o mouse: atualiza contexto, cookie, <html lang> e o rótulo", async () => {
    const user = setup("pt-BR");
    await user.click(screen.getByRole("button", { name: /Idioma/ }));
    await user.click(await screen.findByRole("menuitemradio", { name: /English/ }));
    expect(await screen.findByRole("button", { name: "Language: English" })).toBeInTheDocument();
    expect(document.cookie).toContain("locale=en");
    expect(document.documentElement.lang).toBe("en");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("funciona só com teclado: abre, navega, escolhe e devolve o foco ao gatilho", async () => {
    const user = setup("pt-BR");
    const trigger = screen.getByRole("button", { name: /Idioma/ });
    trigger.focus();
    await user.keyboard("{Enter}");
    await screen.findAllByRole("menuitemradio");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    await waitFor(() => expect(document.cookie).toContain("locale="));
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("Esc fecha sem trocar idioma", async () => {
    const user = setup("es");
    await user.click(screen.getByRole("button", { name: /Idioma/ }));
    await screen.findAllByRole("menuitemradio");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Idioma: Español" })).toBeInTheDocument();
  });
});
