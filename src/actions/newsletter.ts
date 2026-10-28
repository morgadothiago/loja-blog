"use server";

import { Prisma } from "@prisma/client";
import { defineAction } from "@/lib/action";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n-server";
import { newsletterInputSchema } from "@/lib/schemas/newsletter.server";

// Ação pública por desenho (sem sessão). Idempotente: e-mail repetido também
// retorna ok, para não revelar quem já está inscrito.
export const subscribeNewsletter = defineAction(
  { name: "subscribeNewsletter", auth: "public", schema: newsletterInputSchema },
  async (input) => {
    // Honeypot preenchido: finge sucesso e não grava nada.
    if (input.website) return;
    const locale = await getLocale();
    try {
      await db.subscriber.upsert({
        where: { email: input.email },
        create: { email: input.email, locale },
        update: {},
      });
    } catch (error) {
      // Corrida: duas inscrições simultâneas do mesmo e-mail violam o unique; o resultado
      // desejado (estar inscrito) vale.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
      throw error;
    }
  },
);
