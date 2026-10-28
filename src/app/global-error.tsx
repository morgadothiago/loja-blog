"use client";

// Erro no layout raiz: substitui <html>/<body>; sem providers (textos fixos, sem estilos do tema).
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "serif", textAlign: "center", padding: "4rem 1.25rem" }}>
        <div role="alert">
          <h1>Algo deu errado / Something went wrong</h1>
          {digest && <p style={{ fontSize: "0.75rem" }}>Código / Code: {digest}</p>}
          <button type="button" onClick={() => retry()} style={{ minHeight: 44, padding: "0 1.5rem" }}>
            Tentar de novo / Try again
          </button>
        </div>
      </body>
    </html>
  );
}
