"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useI18n } from "@/contexts/language-context";
import { FLASH_COOKIE, isFlashKind } from "@/lib/flash-shared";

// Mostra (uma vez) o toast gravado pelo servidor antes de um redirect (login, cadastro, logout).
// Roda a cada mudança de rota: o redirect de Server Action navega sem remontar o app.
export function FlashToast() {
  const { t } = useI18n();
  const pathname = usePathname();

  useEffect(() => {
    const match = document.cookie.split("; ").find((c) => c.startsWith(`${FLASH_COOKIE}=`));
    if (!match) return;
    // Limpa primeiro: no StrictMode (dev) o efeito roda duas vezes e o toast não pode duplicar.
    document.cookie = `${FLASH_COOKIE}=; path=/; max-age=0`;
    const kind = decodeURIComponent(match.slice(FLASH_COOKIE.length + 1));
    if (isFlashKind(kind)) toast.success(t(`flash.${kind}`));
  }, [pathname, t]);

  return null;
}
