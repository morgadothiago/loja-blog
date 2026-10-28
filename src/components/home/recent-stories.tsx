import Link from "next/link";
import { StoryCard, type Story } from "@/components/home/story-card";
import { getT } from "@/lib/i18n-server";

export async function RecentStories({ stories }: { stories: Story[] }) {
  const { t, locale } = await getT();
  return (
    <section aria-labelledby="stories-title" className="w-full pt-5 pb-8 sm:pt-6 sm:pb-10 lg:pt-8 lg:pb-14">
      {/* content-fit: em telas grandes o bloco ocupa 4/5 (lg) ou 2/3 (2xl) da largura, sem esticar os cards */}
      <div className="content-fit">
        <h2 id="stories-title" className="px-fluid text-3xl sm:text-4xl">
          {t("home.stories.title")}
        </h2>
        {stories.length === 0 ? (
          <p className="text-muted-foreground mt-4 px-fluid text-base">{t("home.stories.empty")}</p>
        ) : (
          // Mobile: faixa rolável com "peek" do próximo card; ≥768px vira grade de 3 colunas.
          <ul className="mt-4 flex items-start snap-x snap-mandatory gap-3 lg:mt-6 overflow-x-auto pb-2 px-fluid md:grid md:grid-cols-3 md:gap-6 md:overflow-visible lg:gap-8">
            {stories.map((story, i) => (
              <li key={story.id} className="w-[46%] shrink-0 snap-start sm:w-2/5 md:w-auto">
                <StoryCard story={story} index={i} locale={locale} />
              </li>
            ))}
          </ul>
        )}
        <div className="px-fluid mt-4 lg:mt-6">
          <Link href="/blog" className="text-base underline underline-offset-4">
            {t("home.stories.viewAll")}
          </Link>
        </div>
      </div>
    </section>
  );
}
