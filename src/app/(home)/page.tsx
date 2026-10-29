import { HomeActivism } from "@/components/home/home-activism";
import { HomeBanner } from "@/components/home/home-banner";
import { HomeIntro } from "@/components/home/home-intro";
import { HomeNewsletter } from "@/components/home/home-newsletter";
import { RecentStories } from "@/components/home/recent-stories";

export const dynamic = "force-dynamic";

// Spec 0013: home no visual das referências elena-home-ref-1..4. Os cards vêm de conteúdo curado (sem banco).
// A faixa mostarda de newsletter saiu da home a pedido do humano; no lugar, HomeNewsletter (mesmo formulário).
export default function HomePage() {
  return (
    <>
      <HomeIntro />
      <HomeBanner />
      <RecentStories />
      <HomeActivism />
      <HomeNewsletter />
    </>
  );
}
