import Link from "next/link";
import { getT } from "@/lib/i18n-server";
import { SITE } from "@/lib/site";

// Rodapé da ref-4 (spec 0013): "arte é vida" à esquerda, links no centro, © à direita (empilhado no mobile).
// Redes e links legais só aparecem com URL/`href` configurados (sem link morto; decisão 4: redes inativas até o
// humano confirmar). Alvos >= 2,75rem.
const linkClass = "ink-link inline-flex min-h-11 items-center";

export async function HomeFooter() {
  const { t } = await getT();
  const links = [
    { key: "instagram", label: t("footer.instagram"), href: SITE.social.instagram, external: true },
    { key: "facebook", label: t("footer.facebook"), href: SITE.social.facebook, external: true },
    ...SITE.footerLinks.map((l) => ({ key: l.labelKey, label: t(l.labelKey), href: l.href, external: false })),
  ].filter((l): l is typeof l & { href: string } => !!l.href);

  return (
    <footer className="border-border mt-24 border-t">
      <div className="page-width grid items-center gap-2 py-6 text-sm md:grid-cols-3 md:gap-6">
        <p className="font-hand text-foreground text-2xl">{t("footer.tagline")}</p>
        {links.length > 0 && (
          <nav aria-label={t("footer.nav")} className="md:justify-self-center">
            <ul className="text-muted-foreground flex flex-wrap items-center gap-x-6">
              {links.map((l) => (
                <li key={l.key}>
                  {l.external ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className={linkClass}>
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        )}
        <div className="text-muted-foreground md:col-start-3 md:justify-self-end md:text-right">
          <p>
            © {new Date().getFullYear()} {SITE.name}
          </p>
          {SITE.credit && (
            <p>
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
        </div>
      </div>
    </footer>
  );
}
