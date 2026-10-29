import collages from "@/assets/About/Characters_1.png";
import feature from "@/assets/About/Characters_2.png";
import banjo from "@/assets/About/Characters_2(1).png";
import whale from "@/assets/About/Whale.png";
import type { ProjectDetail } from "@/lib/content/details";

// Conteúdo de EXEMPLO (imagens do cliente já presentes em src/assets). A ordem do array é a ordem cronológica
// das práticas. Títulos e metadados ficam em i18n (content.projects.N.*), iguais aos da lista.
export const PROJECT_DETAILS: ProjectDetail[] = [
  {
    slug: "projeto-exemplo-1",
    practice: "drawing",
    summary: {
      "pt-BR": "Texto de exemplo: um projeto de desenho sobre travessias e encontros.",
      en: "Sample text: a drawing project about crossings and encounters.",
      es: "Texto de ejemplo: un proyecto de dibujo sobre travesías y encuentros.",
    },
    body: [
      {
        "pt-BR": "Parágrafo de abertura de exemplo, em destaque, apresentando a ideia central do projeto.",
        en: "Sample opening paragraph, highlighted, introducing the central idea of the project.",
        es: "Párrafo de apertura de ejemplo, destacado, que presenta la idea central del proyecto.",
      },
      {
        "pt-BR": "Segundo parágrafo de exemplo, com mais detalhes sobre o processo, os materiais e as pessoas envolvidas. Troque este texto pelo conteúdo real quando ele estiver disponível.",
        en: "Second sample paragraph, with more details about the process, the materials and the people involved. Replace this text with the real content when it is available.",
        es: "Segundo párrafo de ejemplo, con más detalles sobre el proceso, los materiales y las personas involucradas. Sustituye este texto por el contenido real cuando esté disponible.",
      },
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
    ],
  },
  {
    slug: "projeto-exemplo-2",
    practice: "ceramic",
    summary: {
      "pt-BR": "Texto de exemplo: um projeto de cerâmica sobre barro, fogo e tempo.",
      en: "Sample text: a ceramics project about clay, fire and time.",
      es: "Texto de ejemplo: un proyecto de cerámica sobre barro, fuego y tiempo.",
    },
    body: [
      {
        "pt-BR": "Parágrafo de abertura de exemplo para o segundo projeto, em destaque.",
        en: "Sample opening paragraph for the second project, highlighted.",
        es: "Párrafo de apertura de ejemplo para el segundo proyecto, destacado.",
      },
      {
        "pt-BR": "Texto de exemplo sobre a queima, o esmalte e a relação entre as peças e o lugar onde foram feitas.",
        en: "Sample text about firing, glaze and the relationship between the pieces and the place where they were made.",
        es: "Texto de ejemplo sobre la cocción, el esmalte y la relación entre las piezas y el lugar donde se hicieron.",
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
    gallery: [
      {
        src: banjo,
        alt: {
          "pt-BR": "Ilustração de um banjo com folha rosa e cogumelos laranja",
          en: "Illustration of a banjo with a pink leaf and orange mushrooms",
          es: "Ilustración de un banjo con hoja rosa y hongos naranjas",
        },
      },
    ],
  },
  {
    slug: "projeto-exemplo-3",
    practice: "collage",
    summary: {
      "pt-BR": "Texto de exemplo: um projeto de colagem sobre recortes e memória.",
      en: "Sample text: a collage project about cut-outs and memory.",
      es: "Texto de ejemplo: un proyecto de collage sobre recortes y memoria.",
    },
    body: [
      {
        "pt-BR": "Parágrafo de abertura de exemplo para o terceiro projeto, em destaque.",
        en: "Sample opening paragraph for the third project, highlighted.",
        es: "Párrafo de apertura de ejemplo para el tercer proyecto, destacado.",
      },
    ],
    cover: {
      src: collages,
      alt: {
        "pt-BR": "Quatro colagens: lírios, uma flor com um olho, uma tuba com uma flor rosa e um saxofone com uma rosa",
        en: "Four collages: lilies, a flower with an eye, a tuba with a pink flower and a saxophone with a rose",
        es: "Cuatro collages: lirios, una flor con un ojo, una tuba con una flor rosa y un saxofón con una rosa",
      },
    },
    gallery: [],
  },
];
