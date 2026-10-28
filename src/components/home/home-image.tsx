import Image from "next/image";
import { PlaceholderArt } from "@/components/home/placeholder-art";
import { getT } from "@/lib/i18n-server";
import type { ImageSlot } from "@/lib/site";
import { cn } from "@/lib/utils";

type PlaceholderVariant = Parameters<typeof PlaceholderArt>[0]["variant"];

// Slot de imagem da home: arquivo real (HOME_IMAGES em src/lib/site.ts) ou placeholder.
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
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={slot.src}
        alt={slot.altKey ? t(slot.altKey) : ""}
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
