import collages from "@/assets/About/Characters_1.png";
import feature from "@/assets/About/Characters_2.png";
import banjo from "@/assets/About/Characters_2(1).png";
import whale from "@/assets/About/Whale.png";
import type { ResidencyDetail } from "@/lib/content/details";

// Conteúdo de EXEMPLO. Títulos e metadados ficam em i18n (content.festivals.N.*), iguais aos da lista.
export const RESIDENCY_DETAILS: ResidencyDetail[] = [
  {
    slug: "residencia-exemplo-1",
    summary: {
      "pt-BR": "Texto de exemplo: uma residência artística à beira-mar.",
      en: "Sample text: an artistic residency by the sea.",
      es: "Texto de ejemplo: una residencia artística junto al mar.",
    },
    body: [
      {
        "pt-BR": "Parágrafo de abertura de exemplo da residência, em destaque.",
        en: "Sample opening paragraph of the residency, highlighted.",
        es: "Párrafo de apertura de ejemplo de la residencia, destacado.",
      },
      {
        "pt-BR": "Segundo parágrafo de exemplo, sobre o programa, o território e as pessoas que participaram.",
        en: "Second sample paragraph, about the programme, the territory and the people who took part.",
        es: "Segundo párrafo de ejemplo, sobre el programa, el territorio y las personas que participaron.",
      },
    ],
    credits: [
      { "pt-BR": "Participante de exemplo A", en: "Sample participant A", es: "Participante de ejemplo A" },
      { "pt-BR": "Participante de exemplo B", en: "Sample participant B", es: "Participante de ejemplo B" },
    ],
    cover: {
      src: whale,
      alt: {
        "pt-BR": "Ilustração de um cachalote cinza com uma baleia branca dentro e uma figura rosa na cauda",
        en: "Illustration of a grey sperm whale with a white whale inside and a pink figure on its tail",
        es: "Ilustración de un cachalote gris con una ballena blanca dentro y una figura rosa en la cola",
      },
    },
    gallery: [
      {
        src: collages,
        alt: {
          "pt-BR": "Quatro colagens: lírios, uma flor com um olho, uma tuba com uma flor rosa e um saxofone com uma rosa",
          en: "Four collages: lilies, a flower with an eye, a tuba with a pink flower and a saxophone with a rose",
          es: "Cuatro collages: lirios, una flor con un ojo, una tuba con una flor rosa y un saxofón con una rosa",
        },
      },
      {
        src: banjo,
        alt: {
          "pt-BR": "Ilustração de um banjo com folha rosa e cogumelos laranja",
          en: "Illustration of a banjo with a pink leaf and orange mushrooms",
          es: "Ilustración de un banjo con hoja rosa y hongos naranjas",
        },
      },
      {
        src: feature,
        alt: {
          "pt-BR": "Ilustração de uma figura com flor amarela no topo, tocando violão, equilibrada sobre uma gangorra",
          en: "Illustration of a figure with a yellow flower on top, playing a guitar, balanced on a seesaw",
          es: "Ilustración de una figura con una flor amarilla en la cabeza, tocando la guitarra, en equilibrio sobre un balancín",
        },
      },
    ],
  },
  {
    slug: "residencia-exemplo-2",
    summary: {
      "pt-BR": "Texto de exemplo: um festival de ideias e encontros.",
      en: "Sample text: a festival of ideas and encounters.",
      es: "Texto de ejemplo: un festival de ideas y encuentros.",
    },
    body: [
      {
        "pt-BR": "Parágrafo de abertura de exemplo do festival, em destaque.",
        en: "Sample opening paragraph of the festival, highlighted.",
        es: "Párrafo de apertura de ejemplo del festival, destacado.",
      },
    ],
    cover: {
      src: feature,
      alt: {
        "pt-BR": "Ilustração de uma figura com flor amarela no topo, tocando violão, equilibrada sobre uma gangorra",
        en: "Illustration of a figure with a yellow flower on top, playing a guitar, balanced on a seesaw",
        es: "Ilustración de una figura con una flor amarilla en la cabeza, tocando la guitarra, en equilibrio sobre un balancín",
      },
    },
    gallery: [],
  },
  {
    slug: "residencia-exemplo-3",
    summary: {
      "pt-BR": "Texto de exemplo: uma residência de colagem e escrita.",
      en: "Sample text: a collage and writing residency.",
      es: "Texto de ejemplo: una residencia de collage y escritura.",
    },
    body: [
      {
        "pt-BR": "Parágrafo de abertura de exemplo da terceira residência, em destaque.",
        en: "Sample opening paragraph of the third residency, highlighted.",
        es: "Párrafo de apertura de ejemplo de la tercera residencia, destacado.",
      },
    ],
    cover: {
      src: banjo,
      alt: {
        "pt-BR": "Ilustração de um banjo com folha rosa e cogumelos laranja",
        en: "Illustration of a banjo with a pink leaf and orange mushrooms",
        es: "Ilustración de un banjo con hoja rosa y hongos naranjas",
      },
    },
    gallery: [],
  },
];
