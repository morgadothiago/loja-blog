import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createCategory, deleteCategory } from "@/actions/categories";
import { createOrder } from "@/actions/orders";
import { createPost, deletePost, updatePost } from "@/actions/posts";
import { db } from "@/lib/db";

let adminId: string;
let customerId: string;
const as = (id: string, role: string) => authMock.mockResolvedValue({ user: { id, role } });
const fd = (o: Record<string, string>) => Object.entries(o).reduce((f, [k, v]) => (f.set(k, v), f), new FormData());

beforeAll(async () => {
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.post.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.user.deleteMany({ where: { email: { in: ["adm-t@x.com", "cli-t@x.com"] } } });
  adminId = (await db.user.create({ data: { email: "adm-t@x.com", password: "x", role: "ADMIN" } })).id;
  customerId = (await db.user.create({ data: { email: "cli-t@x.com", password: "x" } })).id;
});
afterAll(async () => {
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.post.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.user.deleteMany({ where: { id: { in: [adminId, customerId] } } });
});
beforeEach(() => authMock.mockReset());

describe("posts/categorias (admin)", () => {
  it("cliente não cria post nem exclui categoria: FORBIDDEN; anônimo: UNAUTHENTICATED", async () => {
    as(customerId, "CUSTOMER");
    expect(await createPost(undefined, fd({ title: "Olá", content: "c" }))).toEqual({ ok: false, error: { code: "FORBIDDEN" } });
    expect(await deleteCategory("qualquer")).toMatchObject({ error: { code: "FORBIDDEN" } });
    authMock.mockResolvedValue(null);
    expect(await createCategory(undefined, fd({ name: "Arte", kind: "POST" }))).toMatchObject({ error: { code: "UNAUTHENTICATED" } });
    expect(await db.post.count()).toBe(0);
  });

  it("input inválido -> VALIDATION com campos (nada de 500)", async () => {
    as(adminId, "ADMIN");
    const r = await createPost(undefined, fd({ title: "x", content: "" }));
    expect(r).toMatchObject({ ok: false, error: { code: "VALIDATION", fieldErrors: { title: "TOO_SHORT", content: "REQUIRED" } } });
    expect(await createCategory(undefined, fd({ name: "ok!", kind: "OUTRO" }))).toMatchObject({ error: { code: "VALIDATION", fieldErrors: { kind: "INVALID" } } });
  });

  it("admin cria (redirect relançado), edita e exclui; excluir inexistente -> NOT_FOUND", async () => {
    as(adminId, "ADMIN");
    await expect(createPost(undefined, fd({ title: "Primeiro post", content: "c", published: "on" }))).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_REDIRECT") });
    const post = (await db.post.findFirst())!;
    expect(post).toMatchObject({ slug: "primeiro-post", published: true, authorId: adminId });
    await expect(updatePost(post.id, undefined, fd({ title: "Renomeado", content: "c" }))).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_REDIRECT") });
    expect((await db.post.findUnique({ where: { id: post.id } }))!.published).toBe(false);
    expect(await deletePost(post.id)).toEqual({ ok: true, data: undefined });
    expect(await deletePost(post.id)).toEqual({ ok: false, error: { code: "NOT_FOUND" } });
  });

  it("excluir categoria: ok; categoria em uso por post -> sem 500 (resultado tipado)", async () => {
    as(adminId, "ADMIN");
    await createCategory(undefined, fd({ name: "Arte", kind: "POST" }));
    const cat = (await db.category.findFirst())!;
    expect(await deleteCategory(cat.id)).toMatchObject({ ok: true });
  });
});

describe("createOrder (preço/estoque do banco, transação)", () => {
  let productId: string;
  beforeEach(async () => {
    await db.orderItem.deleteMany();
    await db.order.deleteMany();
    await db.product.deleteMany();
    productId = (await db.product.create({ data: { name: "P", slug: "p", description: "d", priceCents: 1500, stock: 2, published: true, authorId: adminId } })).id;
  });

  it("não logado -> UNAUTHENTICATED", async () => {
    authMock.mockResolvedValue(null);
    expect(await createOrder([{ id: productId, quantity: 1 }])).toEqual({ ok: false, error: { code: "UNAUTHENTICATED" } });
  });

  it("feliz: total pelo preço do banco e estoque decrementado", async () => {
    as(customerId, "CUSTOMER");
    const r = await createOrder([{ id: productId, quantity: 2 }]);
    expect(r.ok).toBe(true);
    const order = (await db.order.findFirst())!;
    expect(order.totalCents).toBe(3000);
    expect((await db.product.findUnique({ where: { id: productId } }))!.stock).toBe(0);
  });

  it("estoque insuficiente -> CONFLICT/OUT_OF_STOCK sem alterar nada", async () => {
    as(customerId, "CUSTOMER");
    expect(await createOrder([{ id: productId, quantity: 3 }])).toEqual({ ok: false, error: { code: "CONFLICT", detailCode: "OUT_OF_STOCK" } });
    expect((await db.product.findUnique({ where: { id: productId } }))!.stock).toBe(2);
    expect(await db.order.count()).toBe(0);
  });

  it("produto inexistente/despublicado -> PRODUCT_UNAVAILABLE; carrinho inválido -> VALIDATION", async () => {
    as(customerId, "CUSTOMER");
    expect(await createOrder([{ id: "nao-existe", quantity: 1 }])).toMatchObject({ error: { code: "CONFLICT", detailCode: "PRODUCT_UNAVAILABLE" } });
    expect(await createOrder([])).toMatchObject({ error: { code: "VALIDATION" } });
    expect(await createOrder([{ id: productId, quantity: 0 }])).toMatchObject({ error: { code: "VALIDATION" } });
  });

  it("5 pedidos simultâneos do último item: 1 sucesso, estoque nunca negativo", async () => {
    as(customerId, "CUSTOMER");
    await db.product.update({ where: { id: productId }, data: { stock: 1 } });
    const results = await Promise.all(Array.from({ length: 5 }, () => createOrder([{ id: productId, quantity: 1 }])));
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect((await db.product.findUnique({ where: { id: productId } }))!.stock).toBe(0);
  });

  it("banco indisponível não vaza mensagem interna", async () => {
    as(customerId, "CUSTOMER");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const orig = db.$transaction;
    (db as { $transaction: unknown }).$transaction = () => Promise.reject(new Error("connect ECONNREFUSED 10.0.0.5:5432 senha=abc"));
    try {
      const r = await createOrder([{ id: productId, quantity: 1 }]);
      expect(r).toEqual({ ok: false, error: { code: "INTERNAL" } });
      expect(JSON.stringify(r)).not.toMatch(/ECONNREFUSED|senha/);
    } finally {
      (db as { $transaction: unknown }).$transaction = orig;
      spy.mockRestore();
    }
  });
});
