import Image from "next/image";
import { ABOUT } from "@/lib/content";
import { getT } from "@/lib/i18n-server";
import { SITE } from "@/lib/site";

// Sobre: layout editorial com os arquivos ORIGINAIS do cliente (import estático: proporção real de cada
// arquivo via aspect-ratio = width/height, sem distorcer; `sizes` coerentes com o teto de 1440px do
// conteúdo). Retrato + texto; foto dupla; ilustração (cachalote); faixa de colagens; botão "download CV"
// só com SITE.cvUrl. Alts neutros (descrevem a imagem; sem fatos biográficos).
export async function AboutContent() {
  const { t } = await getT();
  const { portrait, photos, whale, collages, divider, cv } = ABOUT;
  const ratio = (img: { width: number; height: number }) => ({ aspectRatio: `${img.width} / ${img.height}` });

  return (
    <div className="flex flex-col gap-10 md:gap-14">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10 lg:gap-16">
        <Image
          src={portrait.src}
          alt={t(portrait.altKey)}
          sizes="(min-width: 1440px) 560px, (min-width: 768px) 40vw, 100vw"
          style={ratio(portrait.src)}
          className="w-full shrink-0 object-cover md:w-2/5"
        />
        <div className="min-w-0 flex-1 space-y-4 text-lg leading-relaxed">
          {ABOUT.paragraphKeys.map((key) => (
            <p key={key} className="max-w-[65ch]">
              {t(key)}
            </p>
          ))}
          {SITE.cvUrl && (
            <a
              href={SITE.cvUrl}
              download
              aria-label={t(cv.labelKey)}
              className="focus-visible:ring-ring inline-flex min-h-11 items-center rounded-lg outline-none focus-visible:ring-2"
            >
              <Image src={cv.src} alt="" className="h-11 w-auto" />
            </a>
          )}
        </div>
      </div>

      <section aria-labelledby="about-gallery" className="flex flex-col gap-6 md:gap-10">
        <h2 id="about-gallery" className="text-3xl sm:text-4xl">
          {t("about.gallery")}
        </h2>
        <Image
          src={photos.src}
          alt={t(photos.altKey)}
          sizes="(min-width: 1440px) 1400px, 100vw"
          style={ratio(photos.src)}
          className="w-full object-cover"
        />
        <Image
          src={whale.src}
          alt={t(whale.altKey)}
          sizes="(min-width: 1440px) 1400px, 100vw"
          style={ratio(whale.src)}
          className="w-full object-contain"
        />
        <Image
          src={collages.src}
          alt={t(collages.altKey)}
          sizes="(min-width: 1440px) 1400px, 100vw"
          style={ratio(collages.src)}
          className="w-full object-contain"
        />
        <Image src={divider.src} alt="" className="mx-auto h-16 w-auto brightness-0 md:h-20" />
      </section>
    </div>
  );
}
