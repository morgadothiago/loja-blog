// Coluna de leitura (~65ch, centrada): o 1º parágrafo é o lead em fonte de título; o resto, corpo.
export function ReadingColumn({ paragraphs, children }: { paragraphs: string[]; children?: React.ReactNode }) {
  return (
    <div className="page-width mt-10 md:mt-14">
      <div className="mx-auto max-w-prose space-y-6 text-base leading-relaxed md:text-lg">
        {paragraphs.map((text, i) => (
          <p key={i} className={i === 0 ? "font-heading text-xl leading-snug md:text-2xl" : undefined}>
            {text}
          </p>
        ))}
        {children}
      </div>
    </div>
  );
}
