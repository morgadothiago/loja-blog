import { getT } from "@/lib/i18n-server";

// Esqueleto simples para loading.tsx (anuncia "Carregando..." só para leitores de tela).
export async function LoadingSkeleton() {
  const { t } = await getT();
  return (
    <div role="status" className="space-y-4 px-5 py-8">
      <span className="sr-only">{t("loading.label")}</span>
      <div className="bg-muted h-8 w-1/3 animate-pulse rounded motion-reduce:animate-none" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-muted h-40 animate-pulse rounded motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}
