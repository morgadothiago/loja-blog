import Image from "next/image";
import { getT } from "@/lib/i18n-server";
import type { DetailImage } from "@/lib/content/details";
import { cn } from "@/lib/utils";

const SIZES = "(min-width: 1440px) 700px, (min-width: 768px) 50vw, 100vw";

// Galeria do detalhe. `grid`: 2 colunas (md+) com recuo só no 2º item; `columns`: colunas CSS (md+ 3). Em
// `columns` a ordem de leitura do DOM é a ordem cronológica (o visual lê por coluna: aceitável em galeria).
// Sem imagens: a seção é omitida. Imagens naturais (w-full h-auto): sem recorte.
export async function DetailGallery({ images, variant = "grid" }: { images: DetailImage[]; variant?: "grid" | "columns" }) {
  if (images.length === 0) return null;
  const { t, locale } = await getT();
  return (
    <section className="page-width mt-16 md:mt-20">
      <h2 className="sr-only">{t("detail.gallery")}</h2>
      <ul className={cn(variant === "grid" ? "grid gap-6 md:grid-cols-2 md:gap-8" : "columns-1 gap-6 md:columns-3")}>
        {images.map((image, i) => (
          <li key={i} className={cn("min-w-0", variant === "grid" ? i === 1 && "md:mt-12" : "mb-6 break-inside-avoid")}>
            <Image src={image.src} alt={image.alt[locale]} sizes={SIZES} className="h-auto w-full" />
          </li>
        ))}
      </ul>
    </section>
  );
}
