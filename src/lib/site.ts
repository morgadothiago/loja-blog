import type { MessageKey } from "@/lib/i18n";

// Configuração do site e mapa de imagens da home. Nome/marca: troque aqui (nada de nome
// próprio fixo em componentes).
export const SITE = {
  name: "Loja & Blog",
  // Sem URL = ícone não aparece (não existe link real ainda).
  social: {} as { instagram?: string; facebook?: string },
  // Itens da faixa legal do rodapé. Sem `href` = item não aparece (as páginas ainda não existem).
  footerLinks: [
    { labelKey: "footer.terms" },
    { labelKey: "footer.privacy" },
    { labelKey: "footer.cookies" },
    { labelKey: "footer.contact" },
    { labelKey: "footer.manageCookies" },
  ] as { labelKey: MessageKey; href?: string }[],
  // Crédito "Site por ..." (canto direito do rodapé). Sem valor = não aparece.
  credit: undefined as { name: string; href?: string } | undefined,
};

// Slot de imagem: `src` aponta para um arquivo em public/ (ex.: "/images/home/hero.jpg").
// Sem `src`, a home usa o placeholder SVG original. O texto alternativo vem do i18n
// (`altKey`); sem `altKey` a imagem é tratada como decorativa (alt="").
//
// COMO TROCAR: coloque o arquivo em public/images/home/, preencha `src` do slot abaixo e,
// se a imagem tiver significado, mantenha o `altKey` (edite o texto em src/lib/i18n.ts).
// Só use arquivos que você tenha direito de usar.
export type ImageSlot = {
  src?: string;
  altKey?: MessageKey;
  fit?: "cover" | "contain";
  /** object-position do recorte (ex.: "50% 30%") para manter o foco da imagem. */
  position?: string;
};

export const HOME_IMAGES = {
  // Carrossel do hero (acima do título): 3 slides ~11:6, um visível por vez, overlay cinza.
  heroCarousel: [
    { altKey: "home.carousel.1.alt" },
    { altKey: "home.carousel.2.alt" },
    { altKey: "home.carousel.3.alt" },
  ] as ImageSlot[],
  banner: { altKey: "home.banner.alt" } as ImageSlot, // ~3:1 (panorâmica)
  // Capa de reserva dos 3 cards quando o post não tem coverUrl (o post real sempre vence).
  stories: [{}, {}, {}] as ImageSlot[],
  feature: { altKey: "home.feature.alt", fit: "contain" } as ImageSlot, // ~5:6
  newsletterLeft: {} as ImageSlot, // ~3:4, decorativa
  newsletterRight: {} as ImageSlot, // ~3:5, decorativa
};
