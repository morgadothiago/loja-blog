import type { Metadata } from "next";
import { getT } from "@/lib/i18n-server";
import { MENU_ITEMS } from "@/lib/nav";
import type { MessageKey } from "@/lib/i18n";

// Título e descrição da aba no idioma do cookie. O sufixo " | Nome" vem do title.template do layout.
export async function sectionMetadata(id: string): Promise<Metadata> {
  const { t } = await getT();
  const item = MENU_ITEMS.find((i) => i.id === id);
  return {
    title: item ? t(item.altKey) : undefined,
    description: t(`page.${id}.subtitle` as MessageKey),
  };
}
