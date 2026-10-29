import Link from "next/link";
import { HomeImage } from "@/components/home/home-image";
import { getT } from "@/lib/i18n-server";
import { HOME_IMAGES } from "@/lib/home-images";

// "arte & ativismo" (spec 0013, ref-4): retrato em colagem (2 papéis rasgados, costura, 2 fitas e etiqueta;
// sem mariposa, removida a pedido do humano) + frase grande + link. Papéis em tokens (`moss/30`, `secondary`): o `accent` do projeto é mostarda.
export async function HomeActivism() {
  const { t } = await getT();
  return (
    <section aria-labelledby="activism-title" className="page-width mt-24 grid items-center gap-16 md:mt-32 md:grid-cols-2 md:gap-16">
      <figure className="relative mx-auto w-full max-w-70 md:max-w-104">
        <span aria-hidden="true" className="torn bg-moss/30 absolute -inset-3 -rotate-3 lg:-inset-6 md:-inset-4" />
        <span aria-hidden="true" className="stitch absolute -inset-2 rotate-1 md:-inset-4" />
        <span aria-hidden="true" className="torn bg-secondary absolute -inset-1 rotate-2 md:-inset-2.5" />
        <span aria-hidden="true" className="tape paper-shadow bg-moss/35 absolute -top-3 left-[16%] h-7 w-24 -rotate-6 md:h-9 md:w-32" />
        <span aria-hidden="true" className="tape paper-shadow bg-primary/30 absolute bottom-14 -left-3 h-6 w-16 rotate-12 md:-left-7 md:h-8 md:w-24" />
        <div className="paper-shadow relative">
          <HomeImage
            slot={HOME_IMAGES.portrait}
            placeholder="feature"
            sizes="(min-width: 768px) 26rem, 17.5rem"
            className="torn aspect-[4/5] w-full -rotate-1"
          />
        </div>
        <figcaption className="absolute -bottom-7 right-2 rotate-3 md:-bottom-9 md:right-6">
          <span aria-hidden="true" className="torn paper-shadow bg-secondary absolute inset-0" />
          <span className="font-hand text-foreground relative block px-4 py-1 text-2xl md:text-3xl">{t("home.portrait.tag")}</span>
        </figcaption>
      </figure>
      <div className="min-w-0">
        <h2 id="activism-title" className="font-hand text-primary text-3xl">
          {t("home.feature.label")}
        </h2>
        <p className="font-heading mt-4 text-3xl leading-snug md:text-4xl">{t("home.feature.text")}</p>
        <Link href="/sobre" className="ink-link mt-8 inline-flex min-h-11 items-center">
          {t("home.feature.link")}
        </Link>
      </div>
    </section>
  );
}
