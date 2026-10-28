import Image from "next/image";
import { ABOUT } from "@/lib/content";
import { getT } from "@/lib/i18n-server";
import { SITE } from "@/lib/site";

// Sobre (referência 8.png): foto sangrada com o letreiro, faixa salmão com a bio e as colagens, galeria
// "Sonhos e Desenhos", bio, link de CV e cachalote. Arquivos ORIGINAIS do cliente por import estático
// (proporção real via aspect-ratio = width/height, sem distorcer). Faixas de cor vão de ponta a ponta;
// o conteúdo respeita o teto --content-max (page-width). A newsletter é montada pela página.
export async function AboutContent() {
  const { t } = await getT();
  const { portrait, heroLogo, photos, whale, collages, cv } = ABOUT;
  const ratio = (img: { width: number; height: number }) => ({ aspectRatio: `${img.width} / ${img.height}` });

  return (
    <>
      <section className="relative mx-auto w-full max-w-(--content-max)">
        <Image
          src={portrait.src}
          alt={t(portrait.altKey)}
          priority
          sizes="(min-width: 90rem) 90rem, 100vw"
          className="aspect-3/4 h-auto w-full object-cover object-top md:aspect-video"
        />
        {/* Degradê do token ink só no topo: garante contraste do letreiro branco sobre céu/água claros. */}
        <div aria-hidden="true" className="from-ink/50 pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b to-transparent" />
        <h1 className="absolute top-4 left-5 w-2/5 max-w-xs md:top-8 md:left-8 md:w-1/4">
          <Image
            src={heroLogo.src}
            alt={t(heroLogo.altKey)}
            sizes="(min-width: 48rem) 22rem, 40vw"
            style={ratio(heroLogo.src)}
            className="h-auto w-full"
          />
        </h1>
      </section>

      <section aria-labelledby="about-artist" className="bg-salmon text-ink">
        <div className="page-width flex flex-col gap-6 py-8 md:gap-8 md:py-12">
          <h2 id="about-artist" className="font-heading text-3xl sm:text-4xl">
            {t("about.artist.title")}
          </h2>
          <div className="max-w-[65ch] space-y-4 text-base leading-relaxed md:text-lg">
            {ABOUT.artistKeys.map((key) => (
              <p key={key}>{t(key)}</p>
            ))}
          </div>
          <figure className="flex flex-col gap-2">
            <Image
              src={collages.src}
              alt={t(collages.altKey)}
              sizes="(min-width: 90rem) 87rem, 100vw"
              style={ratio(collages.src)}
              className="w-full object-contain"
            />
            <figcaption className="text-xs md:text-right">{t(collages.captionKey)}</figcaption>
          </figure>
        </div>
      </section>

      <section aria-labelledby="about-gallery" className="page-width flex flex-col gap-6 py-8 md:gap-8 md:py-12">
        <h2 id="about-gallery" className="font-heading text-3xl sm:text-4xl">
          {t("about.gallery")}
        </h2>
        <Image
          src={photos.src}
          alt={t(photos.altKey)}
          sizes="(min-width: 90rem) 87rem, 100vw"
          style={ratio(photos.src)}
          className="w-full object-contain"
        />
        <div className="max-w-[65ch] space-y-4 text-base leading-relaxed md:text-lg">
          {ABOUT.bioKeys.map((key) => (
            <p key={key}>{t(key)}</p>
          ))}
        </div>
        {SITE.cvUrl && (
          <a
            href={SITE.cvUrl}
            download
            aria-label={t(cv.labelKey)}
            className="focus-visible:ring-ring inline-flex min-h-11 items-center self-end rounded-lg outline-none focus-visible:ring-2"
          >
            <Image src={cv.src} alt="" sizes="16rem" className="h-11 w-auto" />
          </a>
        )}
        <Image
          src={whale.src}
          alt={t(whale.altKey)}
          sizes="(min-width: 90rem) 87rem, 100vw"
          style={ratio(whale.src)}
          className="w-full object-contain"
        />
      </section>
    </>
  );
}
