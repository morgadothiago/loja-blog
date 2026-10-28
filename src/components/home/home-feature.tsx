import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { HomeImage } from "@/components/home/home-image";
import { getT } from "@/lib/i18n-server";
import { HOME_IMAGES } from "@/lib/home-images";

export async function HomeFeature() {
  const { t } = await getT();
  return (
    <section className="w-full pt-0 pb-6 sm:pb-10 lg:pb-14">
      <div className="page-width flex items-center justify-center gap-5 md:gap-10 lg:gap-16">
      <HomeImage slot={HOME_IMAGES.feature} placeholder="feature" sizes="(min-width: 1440px) 360px, (min-width: 768px) 25vw, 33vw" className="aspect-[1688/2300] w-1/3 shrink-0 md:w-1/4" />
      <div className="min-w-0 flex-1 space-y-2 md:flex-none md:space-y-4">
        <p className="text-purple flex items-center gap-2 text-sm font-medium">
          <span aria-hidden="true" className="text-salmon text-lg leading-none">✱</span>
          {t("home.feature.label")}
        </p>
        {/* Medida de leitura limitada só no texto (~40 caracteres por linha), não no layout. */}
        <p className="max-w-[40ch] text-lg leading-snug sm:text-xl md:text-3xl">{t("home.feature.text")}</p>
        <Link href="/blog" className="inline-flex min-h-11 items-center gap-1 text-base underline underline-offset-4">
          {t("home.feature.link")}
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </Link>
      </div>
      </div>
    </section>
  );
}
