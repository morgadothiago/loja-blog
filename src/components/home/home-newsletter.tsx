import { NewsletterForm } from "@/components/home/newsletter-form";
import { getT } from "@/lib/i18n-server";

// Seção de newsletter no visual da home da 0013 (papel + tinta, sem faixa mostarda nem arte). Reaproveita o
// NewsletterForm sem alterá-lo; o contêiner `inline-size` é o que dá sentido às unidades cqw do formulário.
export async function HomeNewsletter() {
  const { t } = await getT();
  return (
    <section aria-labelledby="newsletter-title" className="mt-28 md:mt-36">
      <div className="mx-auto w-full max-w-(--content-max) [container-type:inline-size]">
        <div className="page-width">
          {/* Papel rasgado + costura terracota (mesma linguagem da colagem do retrato), tudo decorativo. */}
          <div className="relative mx-auto max-w-3xl px-6 py-12 text-center md:px-12 md:py-16">
            <span aria-hidden="true" className="torn bg-secondary absolute inset-0 -rotate-1" />
            <span aria-hidden="true" className="stitch absolute inset-3 rotate-0 md:inset-4" />
            <span aria-hidden="true" className="tape paper-shadow bg-primary/30 absolute -top-3 left-[12%] h-6 w-20 -rotate-6 md:h-8 md:w-28" />
            <div className="relative flex flex-col items-center gap-4">
              <p className="font-hand text-primary text-2xl md:text-3xl">{t("newsletter.eyebrow")}</p>
              <h2 id="newsletter-title" className="text-3xl md:text-5xl">
                {t("newsletter.title")}
              </h2>
              <p className="text-muted-foreground max-w-prose text-base">{t("newsletter.consent")}</p>
              <div className="mt-2 w-full max-w-md md:w-[48cqw] md:max-w-none">
                <NewsletterForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
