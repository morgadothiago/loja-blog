import Link from "next/link";
import { getT } from "@/lib/i18n-server";
import { SITE } from "@/lib/site";

// Faixa legal fina como na referência: © + Termos/Privacidade/Cookies/Contato/Gerenciar cookies à esquerda,
// "Site por" à direita. Itens de SITE.footerLinks sem `href` (páginas ainda inexistentes) aparecem como TEXTO,
// sem link morto; ganham link assim que `href` for preenchido. Nada de Loja/Blog/Carrinho aqui (não estão na
// referência; seguem no menu).
const itemClass = "tracking-wider uppercase";

export async function HomeFooter() {
  const { t } = await getT();
  return (
    <footer className="page-width flex flex-col gap-1 py-2 text-xs md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 md:gap-x-6">
        <p className={itemClass}>
          © {new Date().getFullYear()} {SITE.name}
        </p>
        <nav aria-label={t("footer.nav")}>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 md:gap-x-6">
            {SITE.footerLinks.map((l) => (
              <li key={l.labelKey}>
                {l.href ? (
                  <Link href={l.href} className={`${itemClass} flex min-h-11 items-center hover:underline`}>
                    {t(l.labelKey)}
                  </Link>
                ) : (
                  <span className={itemClass}>{t(l.labelKey)}</span>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className={itemClass}>
        {t("footer.credit")}
        {SITE.credit && (
          <>
            {" "}
            {SITE.credit.href ? (
              <a href={SITE.credit.href} target="_blank" rel="noopener noreferrer" className="underline">
                {SITE.credit.name}
              </a>
            ) : (
              SITE.credit.name
            )}
          </>
        )}
      </p>
    </footer>
  );
}
