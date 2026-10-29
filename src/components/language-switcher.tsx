"use client";

import { ChevronDownIcon } from "lucide-react";
import { Flag } from "@/components/flags";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/contexts/language-context";
import { LOCALES, LOCALE_LABELS, isLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Seletor de idioma: gatilho mostra bandeira + nome; a lista mostra cada idioma no próprio
// idioma, com marca do atual. Persistência (cookie + contexto) segue em setLocale.
export function LanguageSwitcher({
  className,
  align = "end",
  compact = false,
}: {
  className?: string;
  align?: "start" | "center" | "end";
  /** Gatilho enxuto: bandeira + sigla (PT/EN/ES) + chevron. O nome acessível continua completo. */
  compact?: boolean;
}) {
  const { locale, setLocale, t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            // Compacto: só a bandeira do idioma atual, sem fundo nem borda. O nome acessível vem do texto só para leitores de tela.
            variant={compact ? "ghost" : "outline"}
            aria-label={compact ? undefined : `${t("language.label")}: ${LOCALE_LABELS[locale]}`}
            className={cn(
              "gap-2 rounded-full px-3 text-base",
              !compact && "bg-secondary border-ink/30",
              className,
            )}
          />
        }
      >
        <Flag locale={locale} />
        {compact ? (
          <span className="sr-only">{`${t("language.label")}: ${LOCALE_LABELS[locale]}`}</span>
        ) : (
          <>
            <span>{LOCALE_LABELS[locale]}</span>
            <ChevronDownIcon aria-hidden="true" className="opacity-70" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-auto min-w-52 p-1.5">
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(next) => isLocale(next) && next !== locale && setLocale(next)}
          aria-label={t("language.label")}
        >
          {LOCALES.map((l) => (
            <DropdownMenuRadioItem
              key={l}
              value={l}
              lang={l}
              closeOnClick
              className="min-h-11 gap-3 rounded-lg px-3 text-base"
            >
              <Flag locale={l} />
              {LOCALE_LABELS[l]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
