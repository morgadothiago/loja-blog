import { db } from "@/lib/db";

// Rate limit em Postgres (funciona com várias instâncias). Janela deslizante de 15 min.
export const WINDOW_MS = 15 * 60 * 1000;
export const LIMITS = { email: 5, ip: 20, registerIp: 20 } as const;

export const attemptKeys = {
  email: (email: string) => `email:${email}`,
  ip: (ip: string) => `ip:${ip}`,
  registerIp: (ip: string) => `register-ip:${ip}`,
};

// true = bloqueado (já atingiu o limite de falhas dentro da janela).
export async function isBlocked(key: string, limit: number, now = new Date()) {
  const since = new Date(now.getTime() - WINDOW_MS);
  const count = await db.authAttempt.count({ where: { key, createdAt: { gte: since } } });
  return count >= limit;
}

export async function recordAttempt(keys: string[], now = new Date()) {
  await db.authAttempt.createMany({ data: keys.map((key) => ({ key, createdAt: now })) });
  // Limpeza oportunista: tentativas com mais de 1 dia não servem a ninguém.
  await db.authAttempt.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } });
}

export async function clearAttempts(key: string) {
  await db.authAttempt.deleteMany({ where: { key } });
}

// IP do cliente: só o primeiro de x-forwarded-for (confiável apenas atrás de proxy conhecido).
export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
