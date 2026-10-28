import { SocialLinks } from "@/components/home/social-links";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { HomeImage } from "@/components/home/home-image";
import { getT } from "@/lib/i18n-server";
import { HOME_IMAGES } from "@/lib/home-images";

// Faixa compacta (mustard + ink fixos: marca, não inverte no tema escuro). Arte esquerda emoldurada,
// centro com título + campo/botão lado a lado + ícones sociais, arte direita inclinada que sobe
// um pouco acima da faixa. Fundo de ponta a ponta; conteúdo em page-width.
export async function NewsletterBand() {
  const { t } = await getT();

  return (
    <section className="bg-mustard text-ink relative">
      {/* O contêiner das unidades cqw é limitado ao teto do conteúdo: acima dele a faixa não cresce mais. */}
      <div className="mx-auto w-full max-w-(--content-max) [container-type:inline-size]">
        <div className="page-width flex items-center gap-3 py-3 sm:gap-8 md:min-h-[28cqw] md:py-0">
          {/* Arte esquerda: cartão bege emoldurado (~46x72px no mobile) centralizado na vertical, com um fio
            rosa decorativo que sobe do topo dela até a borda superior da faixa. */}
          <div className="flex shrink-0 flex-col items-center self-stretch md:ml-[3cqw]">
            <span
              aria-hidden="true"
              data-testid="newsletter-thread"
              className="bg-salmon -mt-3 w-px flex-1 md:-mt-0"
            />
            <div className="bg-paper ring-ink/30 p-1 ring-1">
              <HomeImage
                slot={HOME_IMAGES.newsletterLeft}
                placeholder="side"
                sizes="144px"
                className="aspect-[2/3] w-12 sm:w-20 md:aspect-[2/3] md:w-[11cqw]"
              />
            </div>
            <span aria-hidden="true" className="flex-1" />
          </div>
          <div className="mx-auto flex w-full max-w-[17rem] min-w-0 flex-col items-center gap-3 text-center sm:max-w-md md:max-w-none md:w-[41cqw]">
            {/* Título na fonte padrão (sans-serif, font-sans do tema), como no modelo; o h2 global usa a manuscrita. */}
            <h2 className="self-start text-left font-sans text-base font-normal tracking-normal sm:text-xl md:text-[2.2cqw]">
              {t("newsletter.title")}
            </h2>
            <NewsletterForm />
            {/* Ícones desenhados à mão, sempre visíveis (ver SocialLinks). */}
            <SocialLinks
              className="mt-2 -mb-1 self-center md:mt-4"
              iconClassName="h-7 w-auto md:h-9"
              labels={{
                instagram: t("social.instagram"),
                facebook: t("social.facebook"),
              }}
            />
          </div>
          {/* A arte (banjo com folha) já é inclinada: sem rotação extra. Pequena (~46x54px no mobile), na margem
            direita, centralizada e um pouco para baixo do centro no modelo; deslocada só 1/6 da própria
            altura para cima: a folha fica quase dentro da faixa. Proporção da arte aparada: 720x810 = 8/9. */}
          <div className="relative z-10 shrink-0 md:translate-y-[2cqw]">
            <HomeImage
              slot={HOME_IMAGES.newsletterRight}
              placeholder="side-b"
              sizes="(min-width: 1024px) 192px, 144px"
              className="aspect-[8/9] w-16 sm:w-24 md:w-[17cqw]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
