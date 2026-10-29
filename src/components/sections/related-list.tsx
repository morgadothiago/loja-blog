import Image from "next/image";
import Link from "next/link";
import { getT } from "@/lib/i18n-server";
import type { DetailImage } from "@/lib/content/details";

export type RelatedItem = { href: string; title: string; meta: string; cover: DetailImage };

// "Outras jornadas": some quando não há outros itens (0 itens = seção omitida).
export async function RelatedList({ items }: { items: RelatedItem[] }) {
  if (items.length === 0) return null;
  const { t } = await getT();
  return (
    <section className="page-width mt-20 md:mt-28">
      <div className="border-border border-t pt-10">
        <h2 className="font-hand text-primary mb-8 text-3xl">{t("detail.related")}</h2>
        <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.href} className="min-w-0">
              <Link href={item.href} className="group wobble focus-visible:outline-ring block focus-visible:outline-2 focus-visible:outline-offset-4">
                <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden">
                  <Image src={item.cover.src} alt="" fill sizes="(min-width: 1440px) 450px, (min-width: 640px) 50vw, 100vw" className="object-contain" />
                </div>
                <p className="text-muted-foreground mt-3 text-sm tracking-wider break-words uppercase">{item.meta}</p>
                <h3 className="group-hover:underline mt-1 text-2xl break-words">{item.title}</h3>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
