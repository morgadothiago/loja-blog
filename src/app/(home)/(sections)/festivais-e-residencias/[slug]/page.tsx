import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailCover } from "@/components/sections/detail-cover";
import { DetailGallery } from "@/components/sections/detail-gallery";
import { DetailHero } from "@/components/sections/detail-hero";
import { ReadingColumn } from "@/components/sections/reading-column";
import { RelatedList } from "@/components/sections/related-list";
import { getResidency, otherResidencies, residencySlugs } from "@/lib/content/lookup";
import { getT } from "@/lib/i18n-server";

// Ver nota em projetos/[slug]/page.tsx sobre dynamicParams e cookie de idioma.
export const dynamicParams = false;
export const generateStaticParams = () => residencySlugs().map((slug) => ({ slug }));

export async function generateMetadata({ params }: PageProps<"/festivais-e-residencias/[slug]">): Promise<Metadata> {
  const found = getResidency((await params).slug);
  if (!found) return {};
  const { t, locale } = await getT();
  return { title: t(found.entry.titleKey), description: found.detail.summary[locale] };
}

export default async function ResidencyPage({ params }: PageProps<"/festivais-e-residencias/[slug]">) {
  const { slug } = await params;
  const found = getResidency(slug);
  if (!found) notFound();
  const { entry, detail } = found;
  const { t, locale } = await getT();

  return (
    <article className="pb-16 md:pb-24">
      <DetailHero backHref="/festivais-e-residencias" backLabel={t("detail.back.festivals")} meta={t(entry.metaKey)} title={t(entry.titleKey)} />
      <DetailCover image={detail.cover} locale={locale} />
      <ReadingColumn paragraphs={detail.body.map((p) => p[locale])}>
        {detail.credits && detail.credits.length > 0 && (
          <div className="pt-6">
            <h2 className="font-hand text-primary text-2xl">{t("detail.credits")}</h2>
            <p className="text-muted-foreground mt-2">{detail.credits.map((c) => c[locale]).join(" · ")}</p>
          </div>
        )}
      </ReadingColumn>
      <DetailGallery images={detail.gallery} variant="columns" />
      <RelatedList
        items={otherResidencies(slug).map(({ entry: e, detail: d }) => ({
          href: e.href!,
          title: t(e.titleKey),
          meta: t(e.metaKey),
          cover: d.cover,
        }))}
      />
    </article>
  );
}
