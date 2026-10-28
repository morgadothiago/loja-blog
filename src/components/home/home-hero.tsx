import { HomeCarousel } from "@/components/home/home-carousel";
import { HomeImage } from "@/components/home/home-image";
import { getT } from "@/lib/i18n-server";
import { HOME_IMAGES } from "@/lib/site";

const PLACEHOLDERS = ["hero", "banner-b", "banner-c"] as const;

// Hero: carrossel de 3 slides (um visível por vez, largura total, com padding lateral fluido; sem container máximo) acima do título. O overlay cinza fica só nas imagens: título e subtítulo ficam
// abaixo, sobre o bege (bg-secondary), sem sobreposição.
export async function HomeHero() {
  const { t } = await getT();
  const slides = HOME_IMAGES.heroCarousel.map((slot, i) => (
    <HomeImage
      key={i}
      slot={slot}
      placeholder={PLACEHOLDERS[i % 3]}
      sizes="(min-width: 1536px) 67vw, (min-width: 1024px) 80vw, 100vw"
      eager={i === 0}
      className="size-full"
    />
  ));
  return (
    <section id="home-hero" className="bg-secondary text-foreground">
      <div className="px-fluid flex w-full flex-col items-center gap-0 pt-0 pb-10 text-center md:pb-12 lg:pb-14">
        <HomeCarousel
          className="content-fit"
          aspectClassName="aspect-[11/6]"
          slides={slides}
          labels={{
            region: t("carousel.region"),
            prev: t("carousel.prev"),
            next: t("carousel.next"),
            pause: t("carousel.pause"),
            play: t("carousel.play"),
            goTo: t("carousel.goTo"),
            slide: t("carousel.slide"),
          }}
        />
        {/* Títulos já vêm com a caixa certa no i18n (palavras-chave em caixa-alta, conectivos em baixa). */}
        {/* Título e subtítulo juntos (space-y-1 = 4px), como no layout aprovado. */}
        <div className="space-y-1 leading-tight">
          <h1 className="text-xl leading-snug tracking-widest sm:text-2xl lg:text-3xl">{t("home.title")}</h1>
          <p className="font-heading text-purple text-lg tracking-widest sm:text-xl">{t("home.subtitle")}</p>
        </div>
      </div>
    </section>
  );
}
