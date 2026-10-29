import Image from "next/image";
import type { DetailImage } from "@/lib/content/details";
import type { Locale } from "@/lib/i18n";

// Imagem larga do detalhe: proporção reservada (sem layout shift); `contain` porque a arte do cliente é PNG com alfa.
export function DetailCover({ image, locale }: { image: DetailImage; locale: Locale }) {
  return (
    <div className="page-width mt-8 md:mt-12">
      <div className="bg-muted relative aspect-[16/9] w-full overflow-hidden">
        <Image
          src={image.src}
          alt={image.alt[locale]}
          fill
          preload
          sizes="(min-width: 1440px) 1400px, 100vw"
          className="object-contain"
        />
      </div>
    </div>
  );
}
