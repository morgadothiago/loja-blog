import { HomeImage } from "@/components/home/home-image";
import { getT } from "@/lib/i18n-server";
import { HOME_IMAGES } from "@/lib/home-images";

export async function HomeBanner() {
  const { t } = await getT();
  return (
    <figure className="w-full pt-5 pb-0 md:pt-6 lg:pt-8">
      {/* Faixa 2:1 no mobile (como na referência) e 3:1 em md+, dentro da largura máxima do conteúdo (page-width). */}
      <div className="page-width">
        <HomeImage
          slot={HOME_IMAGES.banner}
          placeholder="banner"
          sizes="(min-width: 1440px) 1400px, 100vw"
          className="aspect-[2/1] w-full md:aspect-[3/1]"
        />
        <figcaption className="text-muted-foreground mt-1 text-xs">{t("home.banner.caption")}</figcaption>
      </div>
    </figure>
  );
}
