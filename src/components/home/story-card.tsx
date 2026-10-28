import Image from "next/image";
import Link from "next/link";
import { PlaceholderArt } from "@/components/home/placeholder-art";
import { HOME_IMAGES } from "@/lib/site";
import { cn } from "@/lib/utils";

export type Story = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  categoryName: string | null;
  createdAt: Date;
};

const PLACEHOLDERS = ["card-a", "card-b", "card-c"] as const;
// Proporções e recuos diferentes por posição (colagem, como no layout aprovado). Só estética:
// o conteúdo do post não depende disso.
const ASPECTS = ["aspect-[5/6]", "aspect-[4/3]", "aspect-square"] as const;
const OFFSETS = ["", "md:mt-10 mt-6", ""] as const;

export function StoryCard({ story, index, locale }: { story: Story; index: number; locale: string }) {
  const date = new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" }).format(story.createdAt);
  // Capa do post vence; senão a capa de reserva do slot (HOME_IMAGES.stories); senão placeholder.
  const cover = story.coverUrl ?? HOME_IMAGES.stories[index % 3]?.src;
  const meta = [story.categoryName, date].filter(Boolean).join(" · ");

  return (
    <Link href={`/blog/${story.slug}`} className={cn("group block min-w-0 focus-visible:outline-none", OFFSETS[index % 3])}>
      <div className={cn("bg-muted relative w-full overflow-hidden", ASPECTS[index % 3])}>
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(min-width: 1792px) 560px, (min-width: 768px) 33vw, 45vw"
            className="object-cover"
          />
        ) : (
          <PlaceholderArt variant={PLACEHOLDERS[index % PLACEHOLDERS.length]} className="size-full" />
        )}
      </div>
      <p className="text-muted-foreground mt-2 text-xs lg:mt-3 tracking-wider uppercase">{meta}</p>
      <h3 className="font-body group-hover:underline group-focus-visible:underline mt-1 line-clamp-3 text-lg font-normal">
        {story.title}
      </h3>
    </Link>
  );
}
