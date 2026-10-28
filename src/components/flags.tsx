import type { Locale } from "@/lib/i18n";

// Bandeiras simplificadas em SVG próprio (emoji de bandeira não renderiza no Windows).
// Cores fixas por serem as das bandeiras, não da marca. Decorativas: o nome do idioma é o rótulo.
const FLAGS: Record<Locale, React.ReactNode> = {
  "pt-BR": (
    <>
      <rect width="24" height="16" fill="#009c3b" />
      <path d="M12 2.5 21.5 8 12 13.5 2.5 8Z" fill="#ffdf00" />
      <circle cx="12" cy="8" r="3.2" fill="#002776" />
    </>
  ),
  en: (
    <>
      <rect width="24" height="16" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12, 14].map((y) => (
        <rect key={y} y={y * 1.1428} width="24" height="1.1428" fill="#b22234" />
      ))}
      <rect width="10.5" height="8.6" fill="#3c3b6e" />
    </>
  ),
  es: (
    <>
      <rect width="24" height="16" fill="#aa151b" />
      <rect y="4" width="24" height="8" fill="#f1bf00" />
    </>
  ),
};

export function Flag({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      aria-hidden="true"
      focusable="false"
      className={className ?? "h-4 w-6 shrink-0 rounded-[2px] ring-1 ring-foreground/20"}
    >
      {FLAGS[locale]}
    </svg>
  );
}
