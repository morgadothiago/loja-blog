"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { buttonVariants, Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/language-context";

// Fallback de erro de renderização: sem mensagem técnica; o digest é só código de suporte.
export function ErrorView({ error, retry }: { error: unknown; retry: () => void }) {
  const { t } = useI18n();
  const title = useRef<HTMLHeadingElement>(null);
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;

  useEffect(() => {
    title.current?.focus();
  }, []);

  return (
    <div role="alert" className="mx-auto flex max-w-xl flex-col items-center gap-4 px-5 py-16 text-center">
      <h1 ref={title} tabIndex={-1} className="text-3xl outline-none">{t("error.title")}</h1>
      <p className="text-muted-foreground">{t("error.INTERNAL")}</p>
      {digest && <p className="text-muted-foreground text-xs">{t("error.supportCode")}: {digest}</p>}
      <div className="flex flex-wrap justify-center gap-3">
        <Button className="h-11 px-6 text-base" onClick={() => retry()}>{t("error.retry")}</Button>
        <Link href="/" className={buttonVariants({ variant: "outline", className: "h-11 px-6 text-base" })}>{t("error.home")}</Link>
      </div>
    </div>
  );
}
