import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/sections/page-title";
import { PracticeGallery } from "@/components/sections/practice-gallery";
import { PracticeNav } from "@/components/sections/practice-nav";
import { PRACTICE_SLUGS } from "@/lib/content/details";
import { getPractice, projectsByPractice } from "@/lib/content/lookup";
import { getT } from "@/lib/i18n-server";
import type { MessageKey } from "@/lib/i18n";

export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(PRACTICE_SLUGS).map((tipo) => ({ tipo }));

export async function generateMetadata({ params }: PageProps<"/praticas/[tipo]">): Promise<Metadata> {
  const practice = getPractice((await params).tipo);
  if (!practice) return {};
  const { t } = await getT();
  return { title: t(`practice.${practice}` as MessageKey), description: t(`practice.${practice}.line` as MessageKey) };
}

export default async function PracticePage({ params }: PageProps<"/praticas/[tipo]">) {
  const practice = getPractice((await params).tipo);
  if (!practice) notFound();
  const { t } = await getT();

  const works = projectsByPractice(practice).flatMap(({ entry, detail }) =>
    [detail.cover, ...detail.gallery].map((image, i) => ({
      id: `${detail.slug}-${i}`,
      href: entry.href!,
      title: t(entry.titleKey),
      meta: t(entry.metaKey),
      image,
    })),
  );

  return (
    <>
      <PageTitle kicker={t("practice.kicker")} title={t(`practice.${practice}` as MessageKey)} line={t(`practice.${practice}.line` as MessageKey)} />
      <div className="page-width">
        <PracticeNav current={practice} />
      </div>
      <div className="pb-16 md:pb-24">
        <PracticeGallery works={works} />
      </div>
    </>
  );
}
