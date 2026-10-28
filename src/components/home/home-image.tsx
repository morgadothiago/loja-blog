import Image, { type StaticImageData } from "next/image";
import { PlaceholderArt } from "@/components/home/placeholder-art";
import { getT } from "@/lib/i18n-server";
import type { ImageSlot } from "@/lib/home-images";
import { cn } from "@/lib/utils";

type PlaceholderVariant = Parameters<typeof PlaceholderArt>[0]["variant"];

// Slot de imagem da home: arquivo real (HOME_IMAGES em src/lib/home-images.ts) ou placeholder.
// `className` dimensiona o slot (aspect-* e largura).
export async function HomeImage({
  slot,
  placeholder,
  className,
  sizes,
  eager,
  quality = 85,
}: {
  slot: ImageSlot;
  placeholder: PlaceholderVariant;
  className?: string;
  sizes: string;
  eager?: boolean;
  /** 85: nítido em telas FHD/2x sem pesar (padrão do Next é 75). */
  quality?: number;
}) {
  if (!slot.src) return <PlaceholderArt variant={placeholder} className={className} />;
  const { t } = await getT();
  const alt = slot.altKey ? t(slot.altKey) : "";

  // Recorte por CSS da região da arte (pixels do original, sem gerar arquivo): o contêiner tem a proporção do
  // recorte e a imagem inteira é escalada e deslocada por porcentagens. Proporção original preservada.
  if (slot.crop && typeof slot.src !== "string") {
    const { x, y, width, height } = slot.crop;
    const img: StaticImageData = slot.src;
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image
          src={img}
          alt={alt}
          sizes={sizes}
          quality={quality}
          fetchPriority={eager ? "high" : undefined}
          className="absolute max-w-none"
          style={{
            width: `${(img.width / width) * 100}%`,
            height: "auto",
            left: `${(-x / width) * 100}%`,
            top: `${(-y / height) * 100}%`,
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={slot.src}
        alt={alt}
        fill
        sizes={sizes}
        quality={quality}
        fetchPriority={eager ? "high" : undefined}
        style={slot.position ? { objectPosition: slot.position } : undefined}
        className={slot.fit === "contain" ? "object-contain" : "object-cover"}
      />
    </div>
  );
}
