import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DetailCover } from "@/components/sections/detail-cover";
import { DetailGallery } from "@/components/sections/detail-gallery";
import { DetailHero } from "@/components/sections/detail-hero";
import { ReadingColumn } from "@/components/sections/reading-column";
import { practiceSlug } from "@/lib/content/details";
import { getProject, projectSlugs } from "@/lib/content/lookup";
import { getT } from "@/lib/i18n-server";
import type { MessageKey } from "@/lib/i18n";

// Slug fora do conteúdo = 404 (dynamicParams = false). A página lê o cookie de idioma, logo é dinâmica
// (como a home); generateStaticParams só delimita os slugs válidos.
export const dynamicParams = false;
export const generateStaticParams = () => projectSlugs().map((slug) => ({ slug }));

export async function generateMetadata({ params }: PageProps<"/projetos/[slug]">): Promise<Metadata> {
  const found = getProject((await params).slug);
  if (!found) return {};
  const { t, locale } = await getT();
  return { title: t(found.entry.titleKey), description: found.detail.summary[locale] };
}

export default async function ProjectPage({ params }: PageProps<"/projetos/[slug]">) {
  const found = getProject((await params).slug);
  if (!found) notFound();
  const { entry, detail } = found;
  const { t, locale } = await getT();

  return (
    <article className="pb-16 md:pb-24">
      <DetailHero backHref="/projetos" backLabel={t("detail.back.projects")} meta={t(entry.metaKey)} title={t(entry.titleKey)}>
        <p className="mt-4">
          <Link
            href={`/praticas/${practiceSlug(detail.practice)}`}
            className="font-hand text-primary inline-flex min-h-11 items-center text-2xl"
          >
            <span className="ink-link">
              {t("practice.kicker")}: {t(`practice.${detail.practice}` as MessageKey)}
            </span>
          </Link>
        </p>
      </DetailHero>
      <DetailCover image={detail.cover} locale={locale} />
      <ReadingColumn paragraphs={detail.body.map((p) => p[locale])} />
      <DetailGallery images={detail.gallery} variant="grid" />
    </article>
  );
}
