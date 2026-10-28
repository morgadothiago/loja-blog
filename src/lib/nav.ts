import type { Locale, MessageKey } from "@/lib/i18n";

// Menu da home (letreiros manuscritos). Fonte única: id, rota, chave i18n do texto (alt) e a
// imagem de cada idioma. Arquivos em public/images/menu/{pt,en,es}/ (+ shop.png e close.png);
// os originais ficam em design-assets/menu-originals/ (fora do build).
export type MenuImage = { src: string; width: number; height: number };

export type MenuItem = {
  id: string;
  href: string;
  /** Texto do item (= texto escrito na imagem) por idioma, no dicionário i18n. */
  altKey: MessageKey;
  /** Linhas do letreiro: define a altura de exibição (1 ou 2 linhas) para manter o ritmo. */
  lines: 1 | 2;
  images: Record<Locale, MenuImage>;
};

const img = (dir: string, file: string, width: number, height: number): MenuImage => ({
  src: `/images/menu/${dir}/${file}.png`,
  width,
  height,
});

const SHOP: MenuImage = { src: "/images/menu/shop.png", width: 246, height: 94 };
export const MENU_CLOSE_IMAGE: MenuImage = { src: "/images/menu/close.png", width: 107, height: 126 };

export const MENU_ITEMS: MenuItem[] = [
  { id: "about", href: "/sobre", altKey: "menu.item.about", lines: 1, images: { "pt-BR": img("pt", "sobre", 265, 112), en: img("en", "about", 419, 170), es: img("es", "acerca-de", 416, 119) } },
  { id: "projects", href: "/projetos", altKey: "menu.item.projects", lines: 1, images: { "pt-BR": img("pt", "projetos", 399, 137), en: img("en", "projects", 419, 133), es: img("es", "proyectos", 429, 112) } },
  { id: "exhibitions", href: "/exposicoes", altKey: "menu.item.exhibitions", lines: 1, images: { "pt-BR": img("pt", "exposicoes", 477, 137), en: img("en", "exhibitions", 491, 102), es: img("es", "exposiciones", 519, 112) } },
  { id: "festivals", href: "/festivais-e-residencias", altKey: "menu.item.festivals", lines: 2, images: { "pt-BR": img("pt", "festivais-residencias", 510, 225), en: img("en", "festivals-residencies", 491, 203), es: img("es", "festivales-residencias", 519, 206) } },
  { id: "books", href: "/livros", altKey: "menu.item.books", lines: 1, images: { "pt-BR": img("pt", "livros", 392, 119), en: img("en", "books", 312, 104), es: img("es", "libros", 368, 118) } },
  { id: "news", href: "/blog", altKey: "menu.item.news", lines: 1, images: { "pt-BR": img("pt", "noticias", 499, 119), en: img("en", "news", 280, 94), es: img("es", "noticias", 499, 119) } },
  { id: "shop", href: "/loja", altKey: "menu.item.shop", lines: 1, images: { "pt-BR": SHOP, en: SHOP, es: SHOP } },
];
