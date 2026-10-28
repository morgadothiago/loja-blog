import { cookies } from "next/headers";
import { FLASH_COOKIE, type FlashKind } from "@/lib/flash-shared";

// Só servidor. Cookie de 30s, legível pelo cliente (não é segredo: só o tipo da mensagem), `secure`
// em produção (HTTPS, ex.: Vercel). O texto vem do i18n no cliente, nunca do cookie.
export async function setFlash(kind: FlashKind) {
  (await cookies()).set(FLASH_COOKIE, kind, {
    path: "/",
    maxAge: 30,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
}
