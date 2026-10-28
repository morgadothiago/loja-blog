import type { Metadata } from "next";
import { HomeFooter } from "@/components/home/home-footer";
import { HomeHeader } from "@/components/home/home-header";
import { SITE } from "@/lib/site";

// Páginas filhas definem só o texto; a aba mostra "Texto | Nome do site".
export const metadata: Metadata = {
  title: { template: `%s | ${SITE.name}`, default: SITE.name },
};

// Layout próprio da home: sem contêiner, para as faixas de cor irem de ponta a ponta.
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="inicio" className="flex flex-1 flex-col">
      <HomeHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <HomeFooter />
    </div>
  );
}
