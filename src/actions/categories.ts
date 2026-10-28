"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { defineAction, defineFormAction } from "@/lib/action";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils-app";

const schema = z.object({
  name: z.string().trim().min(2),
  kind: z.enum(["PRODUCT", "POST"]),
});

export const createCategory = defineFormAction({ name: "createCategory", auth: "admin", schema }, async (data) => {
  await db.category.upsert({
    where: { slug_kind: { slug: slugify(data.name), kind: data.kind } },
    update: {},
    create: { ...data, slug: slugify(data.name) },
  });
  revalidatePath("/dashboard/categorias");
});

export const deleteCategory = defineAction(
  { name: "deleteCategory", auth: "admin", schema: z.string().min(1) },
  async (id) => {
    await db.category.delete({ where: { id } });
    revalidatePath("/dashboard/categorias");
  },
);
