import Link from "next/link";
import { StoryCard } from "@/components/home/story-card";
import { HOME_STORIES } from "@/lib/content/home-stories";
import { getT } from "@/lib/i18n-server";

// "Histórias recentes" (spec 0013, decisão 11): os 3 projetos curados em src/lib/content, não posts do blog
// (o blog segue no menu "Notícias"). 1 coluna no mobile (decisão 10), 3 colunas em md+.
export async function RecentStories() {
  const { t, locale } = await getT();
  return (
    <section aria-labelledby="stories-title" className="mt-20 md:mt-28">
      <div className="page-width">
        <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 id="stories-title" className="text-4xl md:text-6xl">
            {t("home.stories.title")} <span className="font-hand text-primary">{t("home.stories.title.hand")}</span>
          </h2>
          <Link href="/projetos" className="ink-link inline-flex min-h-11 items-center self-start text-sm sm:self-auto">
            {t("home.stories.all")}
          </Link>
        </div>
        <ul className="grid gap-10 md:grid-cols-3">
          {HOME_STORIES.map((story, i) => (
            <li key={story.id} className="mx-auto w-full max-w-sm min-w-0 md:max-w-none">
              <StoryCard story={story} index={i} locale={locale} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
