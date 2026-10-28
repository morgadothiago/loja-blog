// Aceita só caminhos internos relativos; qualquer outra coisa vira null (evita open redirect).
// Barra invertida conta: navegadores tratam "/\evil.com" como "//evil.com".
export function safeCallbackPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const base = "http://internal.invalid";
    return new URL(value, base).origin === base ? value : null;
  } catch {
    return null;
  }
}
