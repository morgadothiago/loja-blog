import Image from "next/image";
import { PlaceholderArt } from "@/components/home/placeholder-art";
import type { ContentEntry } from "@/lib/content";
import { cn } from "@/lib/utils";

const PLACEHOLDERS = ["card-a", "card-b", "card-c"] as const;
const ASPECTS = ["aspect-[5/6]", "aspect-[4/3]", "aspect-square"] as const;

// Card de listagem (mesmo vocabulário visual do StoryCard). Não é link: não há página de detalhe
// (default da spec 0005). Imagem decorativa (alt vazio): o título é o nome do item.
export function ContentCard({ entry, title, meta, index }: { entry: ContentEntry; title: string; meta: string; index: number }) {
  const src = entry.image?.src;
  return (
    <article className="min-w-0">
      <div className={cn("bg-muted relative w-full overflow-hidden", ASPECTS[index % 3])}>
        {src ? (
          <Image src={src} alt="" fill sizes="(min-width: 1440px) 450px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        ) : (
          <PlaceholderArt variant={PLACEHOLDERS[index % PLACEHOLDERS.length]} className="size-full" />
        )}
      </div>
      <p className="text-muted-foreground mt-2 text-xs tracking-wider uppercase lg:mt-3">{meta}</p>
      <h2 className="font-sans mt-1 line-clamp-3 text-lg font-normal">{title}</h2>
    </article>
  );
}
