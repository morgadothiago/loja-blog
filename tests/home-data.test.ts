import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getRecentStories } from "@/lib/home-data";

let authorId: string;

beforeAll(async () => {
  await db.post.deleteMany();
  await db.user.deleteMany({ where: { email: "autor-teste@exemplo.com" } });
  const u = await db.user.create({ data: { email: "autor-teste@exemplo.com", password: "x" } });
  authorId = u.id;
  const base = { content: "c", authorId };
  await db.post.create({ data: { ...base, title: "Antigo", slug: "antigo", published: true, createdAt: new Date("2024-01-01") } });
  await db.post.create({ data: { ...base, title: "Rascunho", slug: "rascunho", published: false } });
  for (const n of [1, 2, 3]) {
    await db.post.create({ data: { ...base, title: `P${n}`, slug: `p${n}`, published: true, createdAt: new Date(`2025-0${n}-01`) } });
  }
});

afterAll(async () => {
  await db.post.deleteMany({ where: { authorId } });
  await db.user.delete({ where: { id: authorId } });
});

describe("getRecentStories", () => {
  it("só publicados, mais recentes primeiro, no máximo 3", async () => {
    const stories = await getRecentStories();
    expect(stories.map((s) => s.title)).toEqual(["P3", "P2", "P1"]);
  });
});
