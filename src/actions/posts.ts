"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { defineAction, defineFormAction } from "@/lib/action";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils-app";

const schema = z.object({
  title: z.string().trim().min(2),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  coverUrl: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().optional(),
  published: z.string().optional(), // checkbox: "on" quando marcado
});

function toData(d: z.infer<typeof schema>) {
  return {
    title: d.title,
    excerpt: d.excerpt || null,
    content: d.content,
    coverUrl: d.coverUrl || null,
    categoryId: d.categoryId || null,
    published: d.published === "on",
  };
}

async function uniqueSlug(title: string, ignoreId?: string) {
  const base = slugify(title);
  let slug = base;
  for (let i = 2; ; i++) {
    const found = await db.post.findUnique({ where: { slug } });
    if (!found || found.id === ignoreId) return slug;
    slug = `${base}-${i}`;
  }
}

function refresh() {
  revalidatePath("/dashboard/posts");
  revalidatePath("/blog");
}

export const createPost = defineFormAction({ name: "createPost", auth: "admin", schema }, async (input, { user }) => {
  const data = toData(input);
  await db.post.create({ data: { ...data, slug: await uniqueSlug(data.title), authorId: user!.id } });
  refresh();
  redirect("/dashboard/posts");
});

export const updatePost = defineFormAction(
  { name: "updatePost", auth: "admin", schema },
  async (input, _ctx, id: string) => {
    const data = toData(input);
    await db.post.update({ where: { id }, data: { ...data, slug: await uniqueSlug(data.title, id) } });
    refresh();
    redirect("/dashboard/posts");
  },
);

export const deletePost = defineAction(
  { name: "deletePost", auth: "admin", schema: z.string().min(1) },
  async (id) => {
    await db.post.delete({ where: { id } });
    refresh();
  },
);
