import Image from "next/image";
import Link from "next/link";
import type { HomeStory } from "@/lib/content/home-stories";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Card de "Histórias recentes" (spec 0013, ref-3). Posição define só a estética: o 1º tem leve rotação (-1,5deg)
// e o 2º desce 4rem em md+ (como na referência). O hover `wobble` já respeita prefers-reduced-motion.
const EDGE = ["md:-rotate-[1.5deg]", "", ""] as const;
const OFFSET = ["", "md:mt-16", ""] as const;

export function StoryCard({ story, index, locale }: { story: HomeStory; index: number; locale: Locale }) {
  return (
    <Link
      href={story.href}
      className={cn("wobble focus-visible:outline-ring block min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4", OFFSET[index % 3])}
    >
      <div className={cn("bg-muted relative aspect-square w-full overflow-hidden", EDGE[index % 3])}>
        <Image src={story.cover} alt={story.alt[locale]} fill sizes="(min-width: 1440px) 30rem, (min-width: 768px) 33vw, 100vw" className="object-cover" />
      </div>
      <p className="text-muted-foreground mt-4 text-xs tracking-widest break-words uppercase">
        {story.place[locale]} · {story.year}
      </p>
      <h3 className="mt-1 text-2xl break-words">{story.title}</h3>
    </Link>
  );
}
