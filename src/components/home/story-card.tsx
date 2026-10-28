import Image from "next/image";
import Link from "next/link";
import { PlaceholderArt } from "@/components/home/placeholder-art";
import { HOME_IMAGES } from "@/lib/home-images";
import { cn } from "@/lib/utils";

export type Story = {
  id: string;
  slug: string;
  title: string;
  coverUrl: string | null;
  categoryName: string | null;
  createdAt: Date;
  /** Destino do card. Sem ele, `/blog/${slug}` (post real). Os cards de exemplo apontam para `/blog`. */
  href?: string;
};

const PLACEHOLDERS = ["card-a", "card-b", "card-c"] as const;
// Proporções e recuos diferentes por posição (colagem, como no layout aprovado). Só estética:
// o conteúdo do post não depende disso.
const ASPECTS = ["aspect-[21/20]", "aspect-[4/3]", "aspect-[9/10]"] as const;
const OFFSETS = ["mt-1 md:mt-3", "mt-6 md:mt-10", ""] as const;
// Leve rotação (<= 1,5deg) só na imagem, como na referência; o 3º card também sobe um pouco.
const TILTS = ["", "", "rotate-1"] as const;

export function StoryCard({ story, index, locale }: { story: Story; index: number; locale: string }) {
  const date = new Intl.DateTimeFormat(locale, { year: "numeric" }).format(story.createdAt);
  // Capa do post vence; senão a capa de reserva do slot (HOME_IMAGES.stories); senão placeholder.
  const cover = story.coverUrl ?? HOME_IMAGES.stories[index % 3]?.src;
  const meta = [story.categoryName, date].filter(Boolean).join(" · ");

  return (
    <Link href={story.href ?? `/blog/${story.slug}`} className={cn("group block min-w-0 focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2", OFFSETS[index % 3])}>
      <div className={cn("bg-muted relative w-full overflow-hidden", ASPECTS[index % 3], TILTS[index % 3])}>
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(min-width: 1440px) 450px, 33vw"
            className="object-cover"
          />
        ) : (
          <PlaceholderArt variant={PLACEHOLDERS[index % PLACEHOLDERS.length]} className="size-full" />
        )}
      </div>
      <p className="text-muted-foreground mt-2 text-xs tracking-wide break-words uppercase lg:mt-3">{meta}</p>
      <h3 className="font-sans group-hover:underline group-focus-visible:underline mt-1 line-clamp-3 text-sm font-normal break-words sm:text-base md:text-lg">
        {story.title}
      </h3>
    </Link>
  );
}
