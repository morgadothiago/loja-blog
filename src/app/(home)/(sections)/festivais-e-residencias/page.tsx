import { ContentGrid } from "@/components/sections/content-grid";
import { SectionPage } from "@/components/sections/section-page";
import { sectionMetadata } from "@/lib/section-metadata";

export const generateMetadata = () => sectionMetadata("festivals");

export default function FestivalsPage() {
  return (
    <SectionPage id="festivals">
      <ContentGrid section="festivals" />
    </SectionPage>
  );
}
