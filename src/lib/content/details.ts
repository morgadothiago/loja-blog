import type { StaticImageData } from "next/image";
import type { Locale } from "@/lib/i18n";

// Conteúdo LONGO das páginas de detalhe (spec 0012, alternativa 5.1-B): arquivos tipados, só servidor,
// com as 3 línguas obrigatórias por campo (o tipo `Localized` falha o build se faltar uma). Textos curtos de
// interface continuam em src/lib/i18n.ts. Hoje é conteúdo de EXEMPLO; trocar = editar projects.ts/residencies.ts.
export type Localized = Record<Locale, string>;

export type DetailImage = {
  src: StaticImageData;
  /** Descritivo por idioma. `""` explícito só para imagem puramente decorativa. */
  alt: Localized;
};

export const PRACTICES = ["drawing", "ceramic", "collage"] as const;
export type PracticeId = (typeof PRACTICES)[number];

// Rotas em português (/praticas/desenho...) -> id interno.
export const PRACTICE_SLUGS: Record<string, PracticeId> = {
  desenho: "drawing",
  ceramica: "ceramic",
  colagem: "collage",
};
export const practiceSlug = (id: PracticeId) => Object.entries(PRACTICE_SLUGS).find(([, v]) => v === id)![0];

type DetailBase = {
  slug: string;
  summary: Localized;
  /** O primeiro parágrafo é o lead (fonte de título). */
  body: Localized[];
  cover: DetailImage;
  gallery: DetailImage[];
};

export type ProjectDetail = DetailBase & { practice: PracticeId };
export type ResidencyDetail = DetailBase & { credits?: Localized[] };
