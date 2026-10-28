"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { defineAction, defineFormAction } from "@/lib/action";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils-app";

const schema = z.object({
  name: z.string().trim().min(2),
  description: z.string().min(1),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  imageUrl: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().optional(),
  published: z.string().optional(),
});

function toData(d: z.infer<typeof schema>) {
  return {
    name: d.name,
    description: d.description,
    priceCents: Math.round(d.price * 100),
    stock: d.stock,
    imageUrl: d.imageUrl || null,
    categoryId: d.categoryId || null,
    published: d.published === "on",
  };
}

async function uniqueSlug(name: string, ignoreId?: string) {
  const base = slugify(name);
  let slug = base;
  for (let i = 2; ; i++) {
    const found = await db.product.findUnique({ where: { slug } });
    if (!found || found.id === ignoreId) return slug;
    slug = `${base}-${i}`;
  }
}

function refresh() {
  revalidatePath("/dashboard/produtos");
  revalidatePath("/loja");
}

export const createProduct = defineFormAction({ name: "createProduct", auth: "admin", schema }, async (input, { user }) => {
  const data = toData(input);
  await db.product.create({ data: { ...data, slug: await uniqueSlug(data.name), authorId: user!.id } });
  refresh();
  redirect("/dashboard/produtos");
});

export const updateProduct = defineFormAction(
  { name: "updateProduct", auth: "admin", schema },
  async (input, _ctx, id: string) => {
    const data = toData(input);
    await db.product.update({ where: { id }, data: { ...data, slug: await uniqueSlug(data.name, id) } });
    refresh();
    redirect("/dashboard/produtos");
  },
);

export const deleteProduct = defineAction(
  { name: "deleteProduct", auth: "admin", schema: z.string().min(1) },
  async (id) => {
    await db.product.delete({ where: { id } });
    refresh();
  },
);
