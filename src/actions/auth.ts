"use server";

import { headers } from "next/headers";
import { signIn, signOut } from "@/auth";
import { defineAction } from "@/lib/action";
import { db } from "@/lib/db";
import { BusinessError } from "@/lib/errors";
import { hashPassword } from "@/lib/password";
import { LIMITS, attemptKeys, clientIp, isBlocked, recordAttempt } from "@/lib/rate-limit";
import { loginServerSchema, registerServerSchema } from "@/lib/schemas/auth.server";
import { safeCallbackPath } from "@/lib/safe-path";

// Sem consulta prévia de papel: o destino padrão (/destino) decide por papel DEPOIS do login,
// então a resposta não difere entre e-mail existente e inexistente.
const DEFAULT_DESTINATION = "/destino";

// Sucesso = redirect (relançado pelo wrapper); falhas viram { ok:false, error } tipado:
// INVALID_CREDENTIALS, RATE_LIMITED, VALIDATION... A mensagem é a tradução do código no cliente.
export const login = defineAction({ name: "login", auth: "public", schema: loginServerSchema }, async (input) => {
  await signIn("credentials", {
    email: input.email,
    password: input.password,
    redirectTo: safeCallbackPath(input.callbackUrl) ?? DEFAULT_DESTINATION,
  });
});

export const register = defineAction({ name: "register", auth: "public", schema: registerServerSchema }, async (input) => {
  const ip = clientIp(await headers());
  const ipKey = attemptKeys.registerIp(ip);
  if (await isBlocked(ipKey, LIMITS.registerIp)) throw new BusinessError("RATE_LIMITED", "RATE_LIMITED");
  await recordAttempt([ipKey]);

  // insensitive: "Ana@x.com" e "ana@x.com" são a mesma conta. A corrida entre dois
  // cadastros simultâneos cai no unique do banco (P2002 -> EMAIL_TAKEN).
  const exists = await db.user.findFirst({
    where: { email: { equals: input.email, mode: "insensitive" } },
    select: { id: true },
  });
  if (exists) throw new BusinessError("CONFLICT", "EMAIL_TAKEN");

  await db.user.create({
    data: { name: input.name, email: input.email, password: await hashPassword(input.password), role: "CUSTOMER" },
  });

  // signIn redireciona (lança); o wrapper relança o redirect.
  await signIn("credentials", {
    email: input.email,
    password: input.password,
    redirectTo: safeCallbackPath(input.callbackUrl) ?? "/conta",
  });
});

export async function logout() {
  await signOut({ redirectTo: "/" });
}
