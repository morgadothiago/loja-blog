import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { HomeImage } from "@/components/home/home-image";
import { getT } from "@/lib/i18n-server";
import { HOME_IMAGES, SITE } from "@/lib/site";

export async function HomeFeature() {
  const { t } = await getT();
  return (
    <section className="px-fluid w-full pt-0 pb-6 sm:pb-10 lg:pb-14">
      <div className="content-fit flex items-center gap-5 md:gap-10 lg:gap-16">
      <HomeImage slot={HOME_IMAGES.feature} placeholder="feature" sizes="(min-width: 1536px) 27vw, (min-width: 768px) 32vw, 33vw" className="aspect-[5/6] w-1/3 shrink-0 md:w-2/5" />
      <div className="min-w-0 flex-1 space-y-2 md:space-y-4">
        <p className="text-purple flex items-center gap-2 text-sm font-medium">
          <span aria-hidden="true" className="text-salmon text-lg leading-none">✱</span>
          {t("home.feature.label")}
        </p>
        {/* Medida de leitura limitada só no texto (~40 caracteres por linha), não no layout. */}
        <p className="max-w-[40ch] text-xl leading-snug md:text-3xl">{t("home.feature.text")}</p>
        <Link href="/blog" className="inline-flex min-h-11 items-center gap-1 text-base underline underline-offset-4">
          {t("home.feature.link").replace("{name}", SITE.name)}
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </Link>
      </div>
      </div>
    </section>
  );
}
