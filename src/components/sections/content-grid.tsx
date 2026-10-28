import { ContentCard } from "@/components/sections/content-card";
import { CONTENT_SECTIONS, type ListSectionId } from "@/lib/content";
import { getT } from "@/lib/i18n-server";

// Grade responsiva: 1 coluna (360), 2 (>=640), 3 (>=1024). Lista vazia mostra mensagem.
export async function ContentGrid({ section }: { section: ListSectionId }) {
  const { t } = await getT();
  const entries = CONTENT_SECTIONS[section];
  if (entries.length === 0) return <p className="text-muted-foreground text-base">{t("content.empty")}</p>;
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
      {entries.map((entry, i) => (
        <li key={entry.id} className="min-w-0">
          <ContentCard entry={entry} title={t(entry.titleKey)} meta={t(entry.metaKey)} index={i} />
        </li>
      ))}
    </ul>
  );
}
