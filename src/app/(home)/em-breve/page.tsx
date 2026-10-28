import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/lib/i18n-server";

// Fallback para seções futuras (nenhum item do menu aponta para cá hoje); fora dos buscadores.
export const metadata: Metadata = { title: "Em breve", robots: { index: false } };

export default async function ComingSoonPage() {
  const { t } = await getT();
  return (
    <div className="px-fluid flex flex-col items-center gap-6 py-16 text-center md:py-24">
      <h1 className="text-3xl">{t("soon.title")}</h1>
      <p className="text-muted-foreground max-w-[40ch] text-lg">{t("soon.text")}</p>
      <Link href="/" className={buttonVariants({ className: "h-11 px-6 text-base" })}>
        {t("soon.back")}
      </Link>
    </div>
  );
}
