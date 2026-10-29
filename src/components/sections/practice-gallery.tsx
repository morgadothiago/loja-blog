import Image from "next/image";
import Link from "next/link";
import { getT } from "@/lib/i18n-server";
import type { DetailImage } from "@/lib/content/details";

export type PracticeWork = { id: string; href: string; title: string; meta: string; image: DetailImage };

// Obras de uma prática em colunas CSS (md+ 3), cada uma com link para o projeto. Sem obras: "Em breve".
export async function PracticeGallery({ works }: { works: PracticeWork[] }) {
  const { t, locale } = await getT();
  if (works.length === 0) return <p className="text-muted-foreground page-width text-base">{t("practice.empty")}</p>;
  return (
    <ul className="page-width columns-1 gap-8 md:columns-3">
      {works.map((work) => (
        <li key={work.id} className="mb-8 break-inside-avoid">
          <Link href={work.href} className="group wobble focus-visible:outline-ring block focus-visible:outline-2 focus-visible:outline-offset-4">
            <Image
              src={work.image.src}
              alt={work.image.alt[locale]}
              sizes="(min-width: 1440px) 450px, (min-width: 768px) 33vw, 100vw"
              className="bg-muted h-auto w-full"
            />
            <p className="text-muted-foreground mt-2 text-sm break-words">{work.title} · {work.meta}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
