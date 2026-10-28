import type { StaticImageData } from "next/image";
import type { Locale, MessageKey } from "@/lib/i18n";
import hamburger from "@/assets/About/Menulistras.png";
import eng01 from "@/assets/Menu/Eng_01.png";
import eng02 from "@/assets/Menu/Eng_02.png";
import eng03 from "@/assets/Menu/Eng_03.png";
import eng04 from "@/assets/Menu/Eng_04.png";
import eng05 from "@/assets/Menu/Eng_05.png";
import eng06 from "@/assets/Menu/Eng_06.png";
import shop from "@/assets/Menu/Eng_esp_port_07.png";
import esp01 from "@/assets/Menu/Esp_01.png";
import esp02 from "@/assets/Menu/Esp_02.png";
import esp03 from "@/assets/Menu/Esp_03.png";
import esp04 from "@/assets/Menu/Esp_04.png";
import esp05 from "@/assets/Menu/Esp_05.png";
import esp06 from "@/assets/Menu/Esp_06.png";
import port01 from "@/assets/Menu/Port_01.png";
import port02 from "@/assets/Menu/Port_02.png";
import port03 from "@/assets/Menu/Port_03.png";
import port04 from "@/assets/Menu/Port_04.png";
import port05 from "@/assets/Menu/Port_05.png";
import port06 from "@/assets/Menu/Port_06.png";
import close from "@/assets/Menu/X.png";

// Menu da home (letreiros manuscritos). Fonte única: id, rota, chave i18n do texto (alt) e a imagem de
// cada idioma. Imagens ORIGINAIS do cliente em src/assets/Menu/ (import estático: dimensões intrínsecas
// reais, sem copiar/redimensionar; o next/image otimiza na entrega).
export type MenuImage = StaticImageData;

export type MenuItem = {
  id: string;
  href: string;
  /** Texto do item (= texto escrito na imagem) por idioma, no dicionário i18n. */
  altKey: MessageKey;
  /** Linhas do letreiro: define a altura de exibição (1 ou 2 linhas) para manter o ritmo. */
  lines: 1 | 2;
  images: Record<Locale, MenuImage>;
};

// Botão que abre o menu: Menulistras.png (hambúrguer desenhado à mão, BRANCO sobre transparente, 200x184).
// Fica escuro só por CSS (`brightness-0`) no AppHeader; em header escuro, remover a classe.
export const MENU_HAMBURGER_IMAGE: MenuImage = hamburger;
export const MENU_CLOSE_IMAGE: MenuImage = close;

export const MENU_ITEMS: MenuItem[] = [
  { id: "about", href: "/sobre", altKey: "menu.item.about", lines: 1, images: { "pt-BR": port01, en: eng01, es: esp01 } },
  { id: "projects", href: "/projetos", altKey: "menu.item.projects", lines: 1, images: { "pt-BR": port02, en: eng02, es: esp02 } },
  { id: "exhibitions", href: "/exposicoes", altKey: "menu.item.exhibitions", lines: 1, images: { "pt-BR": port03, en: eng03, es: esp03 } },
  { id: "festivals", href: "/festivais-e-residencias", altKey: "menu.item.festivals", lines: 2, images: { "pt-BR": port04, en: eng04, es: esp04 } },
  { id: "books", href: "/livros", altKey: "menu.item.books", lines: 1, images: { "pt-BR": port05, en: eng05, es: esp05 } },
  { id: "news", href: "/blog", altKey: "menu.item.news", lines: 1, images: { "pt-BR": port06, en: eng06, es: esp06 } },
  { id: "shop", href: "/loja", altKey: "menu.item.shop", lines: 1, images: { "pt-BR": shop, en: shop, es: shop } },
];
