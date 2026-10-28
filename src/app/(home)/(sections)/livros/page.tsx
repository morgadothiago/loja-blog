import { ContentGrid } from "@/components/sections/content-grid";
import { SectionPage } from "@/components/sections/section-page";
import { sectionMetadata } from "@/lib/section-metadata";

export const generateMetadata = () => sectionMetadata("books");

export default function BooksPage() {
  return (
    <SectionPage id="books">
      <ContentGrid section="books" />
    </SectionPage>
  );
}
