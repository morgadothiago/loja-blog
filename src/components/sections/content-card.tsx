import Image from "next/image";
import Link from "next/link";
import { PlaceholderArt } from "@/components/home/placeholder-art";
import type { ContentEntry } from "@/lib/content";
import { cn } from "@/lib/utils";

const PLACEHOLDERS = ["card-a", "card-b", "card-c"] as const;
const ASPECTS = ["aspect-[5/6]", "aspect-[4/3]", "aspect-square"] as const;

// Card de listagem (mesmo vocabulário visual do StoryCard). Com `entry.href` (projetos e residências, spec 0012)
// o card inteiro é um link; sem href (livros) segue sem destino. Imagem decorativa (alt vazio): o título é o nome.
export function ContentCard({ entry, title, meta, index }: { entry: ContentEntry; title: string; meta: string; index: number }) {
  const src = entry.image?.src;
  // Dentro do link o corpo NÃO é <article>: no Chrome o link ficava sem nome acessível (role article não entra
  // no cálculo do nome por conteúdo); só sem link o card é <article>.
  const body = (
    <>
      <div className={cn("bg-muted relative w-full overflow-hidden", ASPECTS[index % 3])}>
        {src ? (
          <Image src={src} alt="" fill sizes="(min-width: 1440px) 450px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        ) : (
          <PlaceholderArt variant={PLACEHOLDERS[index % PLACEHOLDERS.length]} className="size-full" />
        )}
      </div>
      <p className="text-muted-foreground mt-2 text-xs tracking-wider uppercase lg:mt-3">{meta}</p>
      <h2 className={cn("font-sans mt-1 line-clamp-3 text-lg font-normal", entry.href && "group-hover:underline")}>{title}</h2>
    </>
  );
  return entry.href ? (
    <Link href={entry.href} className="group focus-visible:outline-ring block min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4">
      {body}
    </Link>
  ) : (
    <article className="min-w-0">{body}</article>
  );
}
