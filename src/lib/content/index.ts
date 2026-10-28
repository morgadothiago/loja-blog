import type { MessageKey } from "@/lib/i18n";
import type { ImageSlot } from "@/lib/site";

// Conteúdo das páginas do menu: arquivo tipado (sem banco). Textos nas 3 línguas ficam em
// src/lib/i18n.ts (as chaves abaixo são checadas pelo tipo). Para trocar o conteúdo de exemplo:
// edite as entradas e os textos; para imagens reais, preencha `image.src` (arquivos em
// public/images/content/, só com direito de uso).
export type ContentEntry = {
  id: string;
  titleKey: MessageKey;
  /** Linha de metadado em caixa-alta (ex.: ano · local). */
  metaKey: MessageKey;
  image?: ImageSlot;
};

export type ListSectionId = "projects" | "exhibitions" | "festivals" | "books";

const entries = (section: ListSectionId): ContentEntry[] =>
  [1, 2, 3].map((n) => ({
    id: `${section}-${n}`,
    titleKey: `content.${section}.${n}.title` as MessageKey,
    metaKey: `content.${section}.${n}.meta` as MessageKey,
  }));

export const CONTENT_SECTIONS: Record<ListSectionId, ContentEntry[]> = {
  projects: entries("projects"),
  exhibitions: entries("exhibitions"),
  festivals: entries("festivals"),
  books: entries("books"),
};

export const ABOUT = {
  paragraphKeys: ["about.p1", "about.p2", "about.p3"] as MessageKey[],
  image: { altKey: "about.image.alt", fit: "contain" } as ImageSlot,
};
