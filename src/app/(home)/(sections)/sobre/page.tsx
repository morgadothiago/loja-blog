import { NewsletterBand } from "@/components/home/newsletter-band";
import { AboutContent } from "@/components/sections/about-content";
import { sectionMetadata } from "@/lib/section-metadata";

export const generateMetadata = () => sectionMetadata("about");

// Sem SectionPage: a referência abre direto na foto (o h1 é o letreiro dentro de AboutContent).
export default function AboutPage() {
  return (
    <>
      <AboutContent />
      <NewsletterBand />
    </>
  );
}
