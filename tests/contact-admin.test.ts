import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { markContactRead } from "@/actions/contact-admin";
import { db } from "@/lib/db";

let adminId: string;
let customerId: string;
let messageId: string;
const as = (id: string, role: string) => authMock.mockResolvedValue({ user: { id, role } });

beforeAll(async () => {
  await db.user.deleteMany({ where: { email: { in: ["adm-c@x.com", "cli-c@x.com"] } } });
  adminId = (await db.user.create({ data: { email: "adm-c@x.com", password: "x", role: "ADMIN" } })).id;
  customerId = (await db.user.create({ data: { email: "cli-c@x.com", password: "x" } })).id;
});
afterAll(async () => {
  await db.contactMessage.deleteMany();
  await db.user.deleteMany({ where: { id: { in: [adminId, customerId] } } });
});
beforeEach(async () => {
  authMock.mockReset();
  await db.contactMessage.deleteMany();
  messageId = (await db.contactMessage.create({ data: { name: "A", email: "a@x.com", message: "m", locale: "en" } })).id;
});

describe("markContactRead (somente ADMIN)", () => {
  it("anônimo: UNAUTHENTICATED; cliente: FORBIDDEN; nada muda", async () => {
    authMock.mockResolvedValue(null);
    expect(await markContactRead(messageId)).toEqual({ ok: false, error: { code: "UNAUTHENTICATED" } });
    as(customerId, "CUSTOMER");
    expect(await markContactRead(messageId)).toEqual({ ok: false, error: { code: "FORBIDDEN" } });
    expect((await db.contactMessage.findUniqueOrThrow({ where: { id: messageId } })).readAt).toBeNull();
  });

  it("admin marca como lida e repetir não altera a data (idempotente)", async () => {
    as(adminId, "ADMIN");
    expect(await markContactRead(messageId)).toEqual({ ok: true, data: undefined });
    const first = (await db.contactMessage.findUniqueOrThrow({ where: { id: messageId } })).readAt;
    expect(first).toBeInstanceOf(Date);
    expect((await markContactRead(messageId)).ok).toBe(true);
    expect((await db.contactMessage.findUniqueOrThrow({ where: { id: messageId } })).readAt).toEqual(first);
  });

  it("id inexistente: NOT_FOUND; id inválido: VALIDATION", async () => {
    as(adminId, "ADMIN");
    expect(await markContactRead("nao-existe")).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    for (const bad of ["", 42, null, { id: 1 }, "x".repeat(65)]) {
      expect(await markContactRead(bad)).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    }
  });
});
