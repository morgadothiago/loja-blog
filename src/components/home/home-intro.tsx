import { HomeImage } from "@/components/home/home-image";
import { getT } from "@/lib/i18n-server";
import { HOME_IMAGES } from "@/lib/home-images";

const WORDS = ["home.word.1", "home.word.2", "home.word.3", "home.word.4"] as const;

// Topo da home (spec 0013, ref-1): eyebrow, título em 2 linhas (a 2ª em itálico musgo), 4 palavras e o mural
// MOTH inclinado (sem a mariposa: removida a pedido do humano). 1 coluna até lg; 7/5 a partir de lg.
export async function HomeIntro() {
  const { t } = await getT();
  return (
    <section className="page-width grid items-center gap-10 pt-6 pb-12 lg:grid-cols-12 lg:gap-8 lg:pt-8 lg:pb-16">
      <div className="fade-up min-w-0 lg:col-span-7">
        <p className="font-hand text-primary mb-2 text-2xl md:text-3xl">{t("home.welcome")}</p>
        <h1 className="leading-[0.9] break-words text-[clamp(2.75rem,12vw,5rem)] lg:text-[clamp(4.5rem,9vw,8.5rem)]">
          <span className="block">{t("home.heroA")}</span>
          <em className="text-moss block font-light">{t("home.heroB")}</em>
        </h1>
        <ul className="font-hand text-muted-foreground mt-6 flex flex-wrap gap-x-5 gap-y-1 text-2xl md:mt-10 md:text-3xl">
          {WORDS.map((key, i) => (
            <li key={key} className="fade-up" style={{ animationDelay: `${0.3 + i * 0.15}s` }}>
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
      <div className="relative mx-auto w-full max-w-xs lg:col-span-5 lg:mr-0 lg:max-w-md lg:justify-self-end">
        <HomeImage
          slot={HOME_IMAGES.introMural}
          placeholder="feature"
          sizes="(min-width: 1024px) 28rem, 20rem"
          eager
          className="paper-shadow aspect-[4/5] w-full rotate-2"
        />
      </div>
    </section>
  );
}
