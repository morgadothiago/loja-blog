import { CredentialsSignin } from "next-auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { PASSWORD_MAX_BYTES, DUMMY_HASH, passwordBytes, verifyPassword } from "@/lib/password";
import { LIMITS, attemptKeys, clearAttempts, clientIp, isBlocked, recordAttempt } from "@/lib/rate-limit";

// Código lido por mapError (spec 0003): bloqueio temporário por excesso de tentativas.
export class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited";
}

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password: z.string().min(1).refine((v) => passwordBytes(v) <= PASSWORD_MAX_BYTES),
});

export type AuthorizedUser = { id: string; name: string | null; email: string; role: string };

// Regra de autenticação (fica fora de auth.ts para ser testável sem subir o Auth.js):
// normaliza e-mail, limita tentativas, sempre faz bcrypt.compare (tempo igual com/sem usuário),
// recusa desativados com a MESMA resposta de credencial inválida.
export async function authorizeCredentials(raw: unknown, request?: Request, now = new Date()): Promise<AuthorizedUser | null> {
  const parsed = credentialsSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;

  const ip = request ? clientIp(request.headers) : "unknown";
  const emailKey = attemptKeys.email(email);
  const ipKey = attemptKeys.ip(ip);
  if ((await isBlocked(emailKey, LIMITS.email, now)) || (await isBlocked(ipKey, LIMITS.ip, now))) {
    throw new RateLimitedSignin();
  }

  // insensitive: contas antigas com maiúsculas no e-mail continuam entrando.
  const user = await db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  const valid = await verifyPassword(password, user?.password ?? DUMMY_HASH);

  if (!user || !valid || user.disabledAt) {
    await recordAttempt([emailKey, ipKey], now);
    return null;
  }
  await clearAttempts(emailKey);
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
