import type { StaticImageData } from "next/image"
import type { MessageKey } from "@/lib/i18n"
import banjo from "@/assets/About/Characters_2(1).png"
import featureArt from "@/assets/About/Characters_2.png"
import whale from "@/assets/About/Whale.png"
export type ImageSource = string | StaticImageData

export type ImageSlot = {
  src?: ImageSource
  altKey?: MessageKey
  fit?: "cover" | "contain"
  position?: string
  crop?: { x: number; y: number; width: number; height: number }
}

export const HOME_IMAGES = {
  // Carrossel do hero (acima do título): 3 slides ~11:6, um visível por vez, overlay cinza.
  // Slide 1 = Whale.png (cachalote com baleia branca dentro, 2631x905, alfa); os outros 2 seguem placeholders.
  heroCarousel: [
    { src: whale, altKey: "home.carousel.1.alt", fit: "contain" },
    { altKey: "home.carousel.2.alt" },
    { altKey: "home.carousel.3.alt" },
  ] as ImageSlot[],
  banner: { altKey: "home.banner.alt" } as ImageSlot, // ~3:1 (panorâmica)
  // Capa de reserva dos 3 cards quando o post não tem coverUrl (o post real sempre vence).
  stories: [{}, {}, {}] as ImageSlot[],
  // Destaque: Characters_2.png (1688x2300, alfa): figura com flor amarela no topo, violão no tronco, em
  // equilíbrio sobre uma gangorra com olho. ORIGINAL, sem recorte; caixa com a proporção do arquivo.
  feature: {
    src: featureArt,
    altKey: "home.feature.alt",
    fit: "contain",
  } as ImageSlot,
  newsletterLeft: {} as ImageSlot, // ~2:3, decorativa
  // Arte direita da newsletter: banjo com folha rosa, ORIGINAL Characters_2(1).png (1597x2300, alfa). A arte
  // ocupa só o centro do canvas; `crop` mostra exatamente a região da arte (1297x1459 a partir de 85,331),
  // com os pixels originais e a ponta da folha inteira. Já vem inclinada na própria arte.
  newsletterRight: {
    src: banjo,
    altKey: "newsletter.art.alt",
    crop: { x: 85, y: 331, width: 1297, height: 1459 },
  } as ImageSlot,
}
