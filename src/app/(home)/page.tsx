import { HomeBanner } from "@/components/home/home-banner";
import { HomeFeature } from "@/components/home/home-feature";
import { HomeHero } from "@/components/home/home-hero";
import { NewsletterBand } from "@/components/home/newsletter-band";
import { RecentStories } from "@/components/home/recent-stories";
import { getRecentStories } from "@/lib/home-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stories = await getRecentStories();
  return (
    <>
      <HomeHero />
      <HomeBanner />
      <RecentStories stories={stories} />
      <HomeFeature />
      <NewsletterBand />
    </>
  );
}
