import Image from "next/image";
import { getT } from "@/lib/i18n-server";
import { MENU_ITEMS } from "@/lib/nav";
import type { MessageKey } from "@/lib/i18n";

// Casca das páginas do menu: faixa de título (mesma cor do hero) com o letreiro do item como h1
// e uma frase curta; o conteúdo vem em `children`. Fundo full-bleed; conteúdo em page-width (teto único).
export async function SectionPage({ id, children }: { id: string; children: React.ReactNode }) {
  const { t, locale } = await getT();
  const item = MENU_ITEMS.find((i) => i.id === id);
  const image = item?.images[locale];
  const label = item ? t(item.altKey) : id;

  return (
    <>
      <section className="bg-secondary text-foreground">
        <div className="page-width flex flex-col items-center gap-3 pt-6 pb-8 text-center md:pb-10 lg:pb-12">
          <h1>
            {image ? (
              // alt = texto do letreiro; width/height intrínsecos reservam o espaço
              <Image
                src={image.src}
                alt={label}
                width={image.width}
                height={image.height}
                priority={false}
                className="h-12 w-auto max-w-full md:h-16 lg:h-20"
              />
            ) : (
              <span className="font-heading text-4xl">{label}</span>
            )}
          </h1>
          <p className="text-muted-foreground max-w-[50ch] text-base md:text-lg">{t(`page.${id}.subtitle` as MessageKey)}</p>
          <p className="text-muted-foreground text-xs tracking-wider uppercase">{t("content.example")}</p>
        </div>
      </section>
      <div className="page-width py-8 md:py-12 lg:py-14">{children}</div>
    </>
  );
}
