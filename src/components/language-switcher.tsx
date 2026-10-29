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
import { LOCALES, LOCALE_LABELS, isLocale, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LOCALE_CODES: Record<Locale, string> = { "pt-BR": "PT", en: "EN", es: "ES" };

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
            variant="outline"
            // Compacto: sem aria-label; o nome vem do texto visível (sigla) + texto só para leitores de tela (WCAG 2.5.3).
            aria-label={compact ? undefined : `${t("language.label")}: ${LOCALE_LABELS[locale]}`}
            className={cn("bg-secondary border-ink/30 gap-2 rounded-full px-3 text-base", className)}
          />
        }
      >
        <Flag locale={locale} />
        {compact ? (
          <>
            <span className="font-medium tracking-wider">{LOCALE_CODES[locale]}</span>
            <span className="sr-only">{`${t("language.label")}: ${LOCALE_LABELS[locale]}`}</span>
          </>
        ) : (
          <span>{LOCALE_LABELS[locale]}</span>
        )}
        <ChevronDownIcon aria-hidden="true" className="opacity-70" />
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
