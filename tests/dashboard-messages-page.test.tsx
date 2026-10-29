// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: () => authMock() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));

import MessagesPage from "@/app/(private)/dashboard/mensagens/page";
import { LanguageProvider } from "@/contexts/language-context";
import { db } from "@/lib/db";

const props = (page?: string) => ({ searchParams: Promise.resolve(page ? { page } : {}) }) as never;
const show = async (page?: string) =>
  render(<LanguageProvider initialLocale="pt-BR">{await MessagesPage(props(page))}</LanguageProvider>);

beforeAll(() => db.contactMessage.deleteMany());
afterAll(() => db.contactMessage.deleteMany());
beforeEach(async () => {
  authMock.mockReset();
  await db.contactMessage.deleteMany();
});

describe("/dashboard/mensagens", () => {
  it("anônimo e cliente são redirecionados (defesa além do layout)", async () => {
    authMock.mockResolvedValue(null);
    await expect(MessagesPage(props())).rejects.toThrow("REDIRECT:/login");
    authMock.mockResolvedValue({ user: { id: "u", role: "CUSTOMER" } });
    await expect(MessagesPage(props())).rejects.toThrow("REDIRECT:/login");
  });

  it("admin sem mensagens: estado vazio", async () => {
    authMock.mockResolvedValue({ user: { id: "a", role: "ADMIN" } });
    await show();
    expect(screen.getByText("Nenhuma mensagem ainda.")).toBeInTheDocument();
  });

  it("admin vê o texto escapado (HTML não vira elemento), com 'Marcar como lida' só nas não lidas", async () => {
    authMock.mockResolvedValue({ user: { id: "a", role: "ADMIN" } });
    await db.contactMessage.create({ data: { name: "Ana", email: "a@x.com", message: "<img src=x onerror=alert(1)>", locale: "en" } });
    await db.contactMessage.create({ data: { name: "Bia", email: "b@x.com", message: "lida", locale: "pt-BR", readAt: new Date() } });
    const { container } = await show();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Marcar como lida" })).toHaveLength(1);
    expect(within(screen.getByRole("table")).getByText("Lida")).toBeInTheDocument();
  });

  it("paginação: 25 mensagens = 20 na 1ª página e 5 na 2ª; página inválida ou além do fim é normalizada", async () => {
    authMock.mockResolvedValue({ user: { id: "a", role: "ADMIN" } });
    await db.contactMessage.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({ name: `N${i}`, email: "n@x.com", message: `m${i}`, locale: "en" })),
    });
    const first = await show();
    expect(screen.getAllByRole("row")).toHaveLength(1 + 20);
    expect(screen.getByRole("link", { name: "Próxima" })).toHaveAttribute("href", "/dashboard/mensagens?page=2");
    first.unmount();
    const second = await show("2");
    expect(screen.getAllByRole("row")).toHaveLength(1 + 5);
    second.unmount();
    for (const bad of ["abc", "-3", "0", "1.5"]) {
      const r = await show(bad);
      expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();
      r.unmount();
    }
    await show("99");
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
  });
});
