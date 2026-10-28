import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/lib/i18n-server";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-5 py-24 text-center">
      <h1 className="text-3xl">{t("error.notFound.title")}</h1>
      <p className="text-muted-foreground">{t("error.notFound.text")}</p>
      <Link href="/" className={buttonVariants({ className: "h-11 px-6 text-base" })}>{t("error.home")}</Link>
    </main>
  );
}
