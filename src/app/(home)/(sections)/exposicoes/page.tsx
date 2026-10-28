import { ContentGrid } from "@/components/sections/content-grid";
import { SectionPage } from "@/components/sections/section-page";
import { sectionMetadata } from "@/lib/section-metadata";

export const generateMetadata = () => sectionMetadata("exhibitions");

export default function ExhibitionsPage() {
  return (
    <SectionPage id="exhibitions">
      <ContentGrid section="exhibitions" />
    </SectionPage>
  );
}
