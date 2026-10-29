import { SectionPage } from "@/components/sections/section-page";
import { YearList } from "@/components/sections/year-list";
import { CONTENT_SECTIONS } from "@/lib/content";
import { getT } from "@/lib/i18n-server";
import { sectionMetadata } from "@/lib/section-metadata";

export const generateMetadata = () => sectionMetadata("exhibitions");

// Exposições em ordem cronológica decrescente (YearList); sem página de detalhe.
export default async function ExhibitionsPage() {
  const { t } = await getT();
  const items = CONTENT_SECTIONS.exhibitions.map((e) => ({
    id: e.id,
    year: e.year ?? "",
    title: t(e.titleKey),
    place: e.placeKey ? t(e.placeKey) : "",
  }));
  return (
    <SectionPage id="exhibitions">
      <YearList items={items} />
    </SectionPage>
  );
}
