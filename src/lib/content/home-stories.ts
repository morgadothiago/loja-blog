import type { StaticImageData } from "next/image";
import cedars from "@/assets/Home/cedars-cover.jpg";
import mural from "@/assets/Home/moth-mural-1.jpg";
import motherOther from "@/assets/Home/mother-other.jpg";
import type { Localized } from "@/lib/content/details";

// Cards "Histórias recentes" da home (spec 0013, decisão 11): projetos curados da artista, não posts do blog.
// Títulos são nomes próprios de obras (não traduzidos); só o local e o `alt` mudam por idioma.
export type HomeStory = {
  id: string;
  title: string;
  place: Localized;
  year: string;
  cover: StaticImageData;
  alt: Localized;
  href: string;
};

export const HOME_STORIES: HomeStory[] = [
  {
    id: "moth-mural",
    title: "The More-Than-Human Rights Mural",
    place: { "pt-BR": "Design Museum, Londres", en: "Design Museum, London", es: "Design Museum, Londres" },
    year: "2025",
    cover: mural,
    alt: {
      "pt-BR": "O mural More-Than-Human Rights: rios em turquesa e rosa sobre fundo creme, com a placa do título",
      en: "The More-Than-Human Rights Mural: turquoise and pink rivers on a cream background, with the title plaque",
      es: "El mural More-Than-Human Rights: ríos turquesa y rosa sobre fondo crema, con la placa del título",
    },
    href: "/projetos",
  },
  {
    id: "mother-other",
    title: "Mother Other",
    place: { "pt-BR": "MOTH · NYU School of Law", en: "MOTH · NYU School of Law", es: "MOTH · NYU School of Law" },
    year: "2024",
    cover: motherOther,
    alt: {
      "pt-BR": "Livro Mother Other aberto em pé, com capa preta e laranja e uma lua ao centro, sobre fundo cinza",
      en: "The book Mother Other standing open, black and orange cover with a moon at the centre, on a grey background",
      es: "El libro Mother Other abierto en pie, con portada negra y naranja y una luna al centro, sobre fondo gris",
    },
    href: "/projetos",
  },
  {
    id: "song-of-the-cedars",
    title: "Song of the Cedars",
    place: { "pt-BR": "Floresta Los Cedros, Equador", en: "Los Cedros Forest, Ecuador", es: "Bosque Los Cedros, Ecuador" },
    year: "2024",
    cover: cedars,
    alt: {
      "pt-BR": "Capa de Song of the Cedars: duas árvores e duas aves sob um céu estrelado, com o título ao centro",
      en: "Song of the Cedars cover: two trees and two birds under a starry sky, with the title at the centre",
      es: "Portada de Song of the Cedars: dos árboles y dos aves bajo un cielo estrellado, con el título al centro",
    },
    href: "/projetos",
  },
];
