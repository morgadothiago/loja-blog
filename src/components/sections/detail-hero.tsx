import Link from "next/link";

// Topo do detalhe: "voltar" (alvo >= 2,75rem), meta em caixa-alta e o único h1 da página.
export function DetailHero({
  backHref,
  backLabel,
  meta,
  title,
  children,
}: {
  backHref: string;
  backLabel: string;
  meta: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-width pt-6 md:pt-10">
      <Link href={backHref} className="font-hand text-primary -ml-1 inline-flex min-h-11 items-center px-1 text-2xl">
        <span className="ink-link">{backLabel}</span>
      </Link>
      <p className="text-muted-foreground mt-4 text-sm tracking-wider break-words uppercase">{meta}</p>
      <h1 className="fade-up mt-2 max-w-5xl text-4xl leading-tight text-balance break-words sm:text-5xl lg:text-7xl">{title}</h1>
      {children}
    </header>
  );
}
