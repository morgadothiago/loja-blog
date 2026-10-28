import { HomeImage } from "@/components/home/home-image";
import { getT } from "@/lib/i18n-server";
import { HOME_IMAGES } from "@/lib/site";

export async function HomeBanner() {
  const { t } = await getT();
  return (
    <figure className="px-fluid w-full pt-5 pb-0 md:pt-6 lg:pt-8">
      {/* Faixa 3:1 constante; em telas grandes a largura é proporcional (content-fit), sem altura forçada. */}
      <div className="content-fit">
        <HomeImage
          slot={HOME_IMAGES.banner}
          placeholder="banner"
          sizes="(min-width: 1536px) 67vw, (min-width: 1024px) 80vw, 100vw"
          className="aspect-[3/1] w-full"
        />
        <figcaption className="text-muted-foreground mt-1 text-xs">{t("home.banner.caption")}</figcaption>
      </div>
    </figure>
  );
}
