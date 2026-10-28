import { HomeImage } from "@/components/home/home-image";
import { ABOUT } from "@/lib/content";
import { getT } from "@/lib/i18n-server";

// Sobre: imagem em cima no mobile e ao lado a partir de md; medida de leitura (~65ch) só no texto.
export async function AboutContent() {
  const { t } = await getT();
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10 lg:gap-16">
      <HomeImage
        slot={ABOUT.image}
        placeholder="feature"
        sizes="(min-width: 768px) 40vw, 100vw"
        className="aspect-[5/6] w-full max-w-sm shrink-0 md:w-2/5"
      />
      <div className="min-w-0 flex-1 space-y-4 text-lg leading-relaxed">
        {ABOUT.paragraphKeys.map((key) => (
          <p key={key} className="max-w-[65ch]">
            {t(key)}
          </p>
        ))}
      </div>
    </div>
  );
}
