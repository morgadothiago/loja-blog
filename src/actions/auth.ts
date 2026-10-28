"use server";

import { headers } from "next/headers";
import { signIn, signOut } from "@/auth";
import { defineAction } from "@/lib/action";
import { db } from "@/lib/db";
import { BusinessError } from "@/lib/errors";
import { setFlash } from "@/lib/flash";
import { isRedirectError, type FlashKind } from "@/lib/flash-shared";
import { hashPassword } from "@/lib/password";
import { LIMITS, attemptKeys, clientIp, isBlocked, recordAttempt } from "@/lib/rate-limit";
import { loginServerSchema, registerServerSchema } from "@/lib/schemas/auth.server";
import { safeCallbackPath } from "@/lib/safe-path";

// Sem consulta prévia de papel: o destino padrão (/destino) decide por papel DEPOIS do login,
// então a resposta não difere entre e-mail existente e inexistente.
const DEFAULT_DESTINATION = "/destino";

// signIn termina em redirect (lança NEXT_REDIRECT) e o redirect recarrega/troca a página, apagando
// qualquer toast disparado antes. Por isso, no SUCESSO (e só nele) gravamos o cookie "flash", que
// o cliente lê na página de destino e vira toast. Falhas lançam AuthError e não passam por aqui.
async function signInWithFlash(kind: FlashKind, options: { email: string; password: string; redirectTo: string }) {
  try {
    await signIn("credentials", options);
  } catch (e) {
    if (isRedirectError(e)) await setFlash(kind);
    throw e;
  }
}

// Sucesso = redirect (relançado pelo wrapper); falhas viram { ok:false, error } tipado:
// INVALID_CREDENTIALS, RATE_LIMITED, VALIDATION... A mensagem é a tradução do código no cliente.
export const login = defineAction({ name: "login", auth: "public", schema: loginServerSchema }, async (input) => {
  await signInWithFlash("login", {
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
  await signInWithFlash("register", {
    email: input.email,
    password: input.password,
    redirectTo: safeCallbackPath(input.callbackUrl) ?? "/conta",
  });
});

export async function logout() {
  try {
    await signOut({ redirectTo: "/" });
  } catch (e) {
    if (isRedirectError(e)) await setFlash("logout"); // toast "Você saiu" na página de destino
    throw e;
  }
}
