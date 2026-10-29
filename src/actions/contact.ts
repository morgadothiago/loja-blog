"use server";

import { headers } from "next/headers";
import { defineFormAction } from "@/lib/action";
import { db } from "@/lib/db";
import { BusinessError } from "@/lib/errors";
import { getLocale } from "@/lib/i18n-server";
import { LIMITS, attemptKeys, clientIp, isBlocked, recordAttempt } from "@/lib/rate-limit";
import { contactInputSchema } from "@/lib/schemas/contact.server";

// Ação pública por desenho (endpoint aberto): validação Zod, honeypot e rate limit por IP. Não loga nome,
// e-mail nem mensagem (logError só recebe falhas inesperadas, sem a entrada).
export const sendContactMessage = defineFormAction(
  { name: "sendContactMessage", auth: "public", schema: contactInputSchema },
  async (input) => {
    // Honeypot preenchido: finge sucesso e não grava nada.
    if (input.website) return;

    const ip = clientIp(await headers());
    const key = attemptKeys.contactIp(ip);
    if (await isBlocked(key, LIMITS.contactIp)) throw new BusinessError("RATE_LIMITED", "CONTACT_RATE_LIMITED");
    // Conta toda mensagem válida (não só falhas): o limite é de envios por janela.
    await recordAttempt([key]);

    await db.contactMessage.create({
      data: { name: input.name, email: input.email, message: input.message, locale: await getLocale() },
    });
  },
);
