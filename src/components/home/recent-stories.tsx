import { StoryCard, type Story } from "@/components/home/story-card";
import { getT } from "@/lib/i18n-server";

// Sem posts publicados a seção mantém o esqueleto da referência (3 cards) com dados de exemplo,
// que somem sozinhos assim que houver posts reais. Os de exemplo apontam para /blog.
const SAMPLE_KEYS = ["home.stories.sample.1", "home.stories.sample.2", "home.stories.sample.3"] as const;

export async function RecentStories({ stories }: { stories: Story[] }) {
  const { t, locale } = await getT();
  const sampleDate = new Date(Date.UTC(2024, 5, 1));
  const items: Story[] =
    stories.length > 0
      ? stories
      : SAMPLE_KEYS.map((key, i) => ({
          id: `sample-${i + 1}`,
          slug: `sample-${i + 1}`,
          title: t(key),
          coverUrl: null,
          categoryName: t("home.stories.sample.category"),
          createdAt: sampleDate,
          href: "/blog",
        }));
  return (
    <section aria-labelledby="stories-title" className="w-full pt-5 pb-12 sm:pt-6 lg:pt-8 lg:pb-14">
      {/* Título e grade dentro de page-width. */}
      <div className="page-width">
        <h2 id="stories-title" className="text-3xl sm:text-4xl">
          {t("home.stories.title")}
        </h2>
        {/* 3 colunas desde 360px (como na referência); os cards têm proporções e recuos diferentes. */}
        <ul className="mt-4 grid grid-cols-3 items-start gap-3 md:gap-6 lg:mt-6 lg:gap-8">
          {items.map((story, i) => (
            <li key={story.id} className="min-w-0">
              <StoryCard story={story} index={i} locale={locale} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
