// Cabeçalho de página sem letreiro PNG (contato, práticas): kicker manuscrito de uma linha + h1 curto.
// h1 com text-balance e break-words: títulos longos em 360 não estouram.
export function PageTitle({ kicker, title, line }: { kicker?: string; title: string; line?: string }) {
  return (
    <header className="page-width pt-10 pb-8 md:pt-14 md:pb-10">
      {kicker && <p className="font-hand text-primary text-2xl">{kicker}</p>}
      <h1 className="mt-1 text-4xl leading-tight text-balance break-words sm:text-5xl lg:text-7xl">{title}</h1>
      {line && <p className="font-hand text-muted-foreground mt-3 text-2xl">{line}</p>}
    </header>
  );
}
