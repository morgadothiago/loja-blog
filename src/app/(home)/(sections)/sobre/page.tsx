import { AboutContent } from "@/components/sections/about-content";
import { SectionPage } from "@/components/sections/section-page";
import { sectionMetadata } from "@/lib/section-metadata";

export const generateMetadata = () => sectionMetadata("about");

export default function AboutPage() {
  return (
    <SectionPage id="about">
      <AboutContent />
    </SectionPage>
  );
}
