// Mensagem "flash" que sobrevive ao redirect do login/logout: o servidor grava um cookie curto
// e o cliente mostra o toast na página de destino (o toast disparado antes do redirect se perderia).
export const FLASH_COOKIE = "flash";
export const FLASH_KINDS = ["login", "register", "logout"] as const;
export type FlashKind = (typeof FLASH_KINDS)[number];

export const isFlashKind = (value: unknown): value is FlashKind => FLASH_KINDS.includes(value as FlashKind);

export function isRedirectError(e: unknown) {
  const digest = (e as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}
