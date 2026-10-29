import type { MessageKey } from "@/lib/i18n";
import type { ImageSlot } from "@/lib/home-images";
import collages from "@/assets/About/Characters_1.png";
import cvButton from "@/assets/About/DownloadCV.png";
import portrait from "@/assets/About/Foto_ppal.jpg";
import photos from "@/assets/About/Photos2_png.png";
import heroLogo from "@/assets/About/Elena_landinez.png";
import whale from "@/assets/About/Whale.png";

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
  /** Destino do card (spec 0012: só projetos e festivais/residências têm página de detalhe). */
  href?: string;
  /** Ano (não traduzido) e local: usados pela lista cronológica de exposições (YearList). */
  year?: string;
  placeKey?: MessageKey;
};

export type ListSectionId = "projects" | "exhibitions" | "festivals" | "books";

// Slugs (URL, não traduzidos) conferem com PROJECT_DETAILS / RESIDENCY_DETAILS (teste de completude).
const DETAIL_BASE: Partial<Record<ListSectionId, { path: string; slug: string }>> = {
  projects: { path: "/projetos", slug: "projeto-exemplo" },
  festivals: { path: "/festivais-e-residencias", slug: "residencia-exemplo" },
};
const EXHIBITION_YEARS = ["2025", "2024", "2022"];

const entries = (section: ListSectionId): ContentEntry[] =>
  [1, 2, 3].map((n) => {
    const detail = DETAIL_BASE[section];
    return {
      id: `${section}-${n}`,
      titleKey: `content.${section}.${n}.title` as MessageKey,
      metaKey: `content.${section}.${n}.meta` as MessageKey,
      ...(detail && { href: `${detail.path}/${detail.slug}-${n}` }),
      ...(section === "exhibitions" && {
        year: EXHIBITION_YEARS[n - 1],
        placeKey: `content.exhibitions.${n}.place` as MessageKey,
      }),
    };
  });

export const CONTENT_SECTIONS: Record<ListSectionId, ContentEntry[]> = {
  projects: entries("projects"),
  exhibitions: entries("exhibitions"),
  festivals: entries("festivals"),
  books: entries("books"),
};

// Página Sobre: imagens ORIGINAIS do cliente (src/assets/About), import estático = dimensões reais; o next/image
// otimiza na entrega. Trocar/remover = editar aqui. As fotos são pessoais: o uso é autorizado pelo responsável.
export const ABOUT = {
  artistKeys: ["about.artist.p1", "about.artist.p2"] as MessageKey[],
  bioKeys: ["about.bio.p1", "about.bio.p2"] as MessageKey[],
  portrait: { src: portrait, altKey: "about.portrait.alt" as MessageKey },
  // Letreiro (arquivo do cliente) sobre a foto: o alt repete o texto escrito nele.
  heroLogo: { src: heroLogo, altKey: "about.hero.alt" as MessageKey },
  photos: { src: photos, altKey: "about.photos.alt" as MessageKey },
  whale: { src: whale, altKey: "home.carousel.1.alt" as MessageKey },
  collages: { src: collages, altKey: "about.collages.alt" as MessageKey, captionKey: "about.collages.caption" as MessageKey },
  // "download CV" (DownloadCV.png já é escuro). O link só aparece com SITE.cvUrl (sem link morto).
  cv: { src: cvButton, labelKey: "about.cv.label" as MessageKey },
};
