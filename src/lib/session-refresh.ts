// Revalida o JWT de tempos em tempos: usuário apagado/desativado perde a sessão e mudança de
// papel vale sem novo login. Função pura (consulta injetada) para ser testável.
export const REVALIDATE_EVERY_MS = 5 * 60 * 1000;

export type TokenLike = { id?: string; role?: string; checkedAt?: number; [k: string]: unknown };
export type UserLookup = (id: string) => Promise<{ role: string; disabledAt: Date | null } | null>;

// Retorna o token (possivelmente atualizado) ou null para encerrar a sessão.
export async function refreshToken<T extends TokenLike>(token: T, lookup: UserLookup, now = Date.now()): Promise<T | null> {
  if (!token.id) return token;
  if (token.checkedAt && now - token.checkedAt < REVALIDATE_EVERY_MS) return token;
  const user = await lookup(token.id);
  if (!user || user.disabledAt) return null;
  return { ...token, role: user.role, checkedAt: now };
}
