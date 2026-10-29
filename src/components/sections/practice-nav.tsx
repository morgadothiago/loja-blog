import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PRACTICES, practiceSlug, type PracticeId } from "@/lib/content/details";
import { getT } from "@/lib/i18n-server";
import type { MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Chips das práticas (sem item no menu: não há letreiro PNG). Alvos >= 2,75rem; `aria-current` na ativa.
export async function PracticeNav({ current }: { current?: PracticeId }) {
  const { t } = await getT();
  return (
    <nav aria-label={t("practice.nav")} className="mb-8">
      <ul className="flex flex-wrap gap-3">
        {PRACTICES.map((id) => (
          <li key={id}>
            <Link
              href={`/praticas/${practiceSlug(id)}`}
              aria-current={current === id ? "page" : undefined}
              className={cn(
                buttonVariants({ variant: current === id ? "default" : "outline" }),
                "h-11 rounded-full px-5 text-base",
              )}
            >
              {t(`practice.${id}` as MessageKey)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
