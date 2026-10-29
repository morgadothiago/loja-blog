import { HomeImage } from "@/components/home/home-image";
import { getT } from "@/lib/i18n-server";
import { HOME_IMAGES } from "@/lib/home-images";

// Mural largo (spec 0013, ref-2): 2:1 no mobile e 5:2 a partir de md, dentro de page-width (nunca por altura de
// janela, que escondia o mural no mobile). Legenda sempre visível, >= 0,75rem.
export async function HomeBanner() {
  const { t } = await getT();
  return (
    <figure className="w-full">
      <div className="page-width">
        <HomeImage
          slot={HOME_IMAGES.banner}
          placeholder="banner"
          sizes="(min-width: 1440px) 1400px, 100vw"
          className="aspect-[2/1] w-full md:aspect-[5/2]"
        />
        <figcaption className="text-muted-foreground mt-3 text-xs">{t("home.banner.caption")}</figcaption>
      </div>
    </figure>
  );
}
