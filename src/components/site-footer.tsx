"use client";

import { useI18n } from "@/contexts/language-context";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t p-4 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} Loja &amp; Blog · {t("footer.rights")}
    </footer>
  );
}
