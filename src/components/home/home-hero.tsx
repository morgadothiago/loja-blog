import { HomeImage } from "@/components/home/home-image";
import { getT } from "@/lib/i18n-server";
import { HOME_IMAGES } from "@/lib/home-images";

// Hero: UMA ilustração grande (sem carrossel, sem controles, sem overlay) sobre o bege (bg-secondary), com o
// título e o subtítulo logo abaixo, como na referência. A arte vem do slot HOME_IMAGES.heroCarousel[0].
// O HomeCarousel continua no código (testado), mas não é renderizado aqui.
export async function HomeHero() {
  const { t } = await getT();
  return (
    <section id="home-hero" className="bg-secondary text-foreground">
      <div className="page-width flex flex-col items-center gap-0 pt-0 pb-10 text-center md:pb-12 lg:pb-14">
        <HomeImage
          slot={HOME_IMAGES.heroCarousel[0]}
          placeholder="hero"
          sizes="(min-width: 1440px) 1400px, 100vw"
          eager
          className="aspect-[11/6] w-full"
        />
        {/* Títulos já vêm com a caixa certa no i18n (palavras-chave em caixa-alta, conectivos em baixa).
            Tracking menor que antes: a manuscrita pesada com tracking largo estourava 20rem no mobile. */}
        <div className="space-y-1 leading-tight">
          <h1 className="text-xl leading-snug tracking-wide text-balance sm:text-2xl lg:text-3xl">{t("home.title")}</h1>
          <p className="font-heading text-purple text-lg tracking-wide sm:text-xl">{t("home.subtitle")}</p>
        </div>
      </div>
    </section>
  );
}
