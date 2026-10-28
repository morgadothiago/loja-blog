import Link from "next/link";
import { getT } from "@/lib/i18n-server";
import { SITE } from "@/lib/site";

const linkClass = "flex min-h-11 items-center tracking-wider uppercase hover:underline";

// Faixa legal como no layout aprovado (© ano, termos, privacidade…, crédito à direita).
// Itens sem `href` em SITE.footerLinks e o crédito vazio não aparecem (sem links mortos).
export async function HomeFooter() {
  const { t } = await getT();
  const legal = SITE.footerLinks.filter((l): l is typeof l & { href: string } => !!l.href);
  const links = [
    { href: "/loja", label: t("nav.shop") },
    { href: "/blog", label: t("nav.blog") },
    { href: "/carrinho", label: t("nav.cart") },
    ...legal.map((l) => ({ href: l.href, label: t(l.labelKey) })),
  ];
  return (
    <footer className="px-fluid flex w-full flex-col gap-2 py-2 text-xs md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-x-6">
        <p className="flex min-h-11 items-center tracking-wider uppercase">
          © {new Date().getFullYear()} {SITE.name}
        </p>
        <nav aria-label={t("footer.nav")}>
          <ul className="flex flex-wrap gap-x-6">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {SITE.credit && (
        <p className="tracking-wider uppercase">
          {t("footer.credit")}{" "}
          {SITE.credit.href ? (
            <a href={SITE.credit.href} target="_blank" rel="noopener noreferrer" className="underline">
              {SITE.credit.name}
            </a>
          ) : (
            SITE.credit.name
          )}
        </p>
      )}
    </footer>
  );
}
