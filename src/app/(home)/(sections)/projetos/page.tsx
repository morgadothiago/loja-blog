import { ContentGrid } from "@/components/sections/content-grid";
import { SectionPage } from "@/components/sections/section-page";
import { sectionMetadata } from "@/lib/section-metadata";

export const generateMetadata = () => sectionMetadata("projects");

export default function ProjectsPage() {
  return (
    <SectionPage id="projects">
      <ContentGrid section="projects" />
    </SectionPage>
  );
}
