"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { defineAction } from "@/lib/action";
import { db } from "@/lib/db";
import { BusinessError } from "@/lib/errors";

// Somente ADMIN (defineAction valida sessão e papel antes de validar o input).
export const markContactRead = defineAction(
  { name: "markContactRead", auth: "admin", schema: z.string().min(1).max(64) },
  async (id) => {
    const { count } = await db.contactMessage.updateMany({ where: { id, readAt: null }, data: { readAt: new Date() } });
    if (count === 0 && !(await db.contactMessage.findUnique({ where: { id }, select: { id: true } }))) {
      throw new BusinessError("NOT_FOUND", "MESSAGE_NOT_FOUND");
    }
    revalidatePath("/dashboard/mensagens");
  },
);
