import { getT } from "@/lib/i18n-server";

export type YearListItem = { id: string; year: string; title: string; place: string };

// Lista cronológica (ano manuscrito / título / local) do protótipo, em ul/li semânticos. Mobile: ano + título na
// 1ª linha e local abaixo; md+: 12 colunas. Lista vazia mostra a mensagem padrão.
export async function YearList({ items }: { items: YearListItem[] }) {
  const { t } = await getT();
  if (items.length === 0) return <p className="text-muted-foreground text-base">{t("content.empty")}</p>;
  return (
    <ul className="border-border border-t">
      {items.map((item) => (
        <li
          key={item.id}
          className="border-border hover:bg-muted/60 focus-within:bg-muted/60 grid grid-cols-[4.5rem_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 border-b px-2 py-5 motion-safe:transition-colors md:grid-cols-12 md:py-6"
        >
          <span className="font-hand text-primary text-3xl md:col-span-2">{item.year}</span>
          <h2 className="font-heading min-w-0 text-2xl break-words md:col-span-6 md:text-3xl">{item.title}</h2>
          <p className="text-muted-foreground col-start-2 text-base md:col-span-4 md:col-start-auto md:text-right">{item.place}</p>
        </li>
      ))}
    </ul>
  );
}
