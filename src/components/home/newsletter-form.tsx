"use client";

import { useMemo } from "react";
import { MailIcon } from "lucide-react";
import { toast } from "sonner";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { subscribeNewsletter } from "@/actions/newsletter";
import { ControlledInput } from "@/components/forms/controlled-input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/language-context";
import { runWithGuards } from "@/lib/client-action";
import { createNewsletterSchema, type NewsletterFormValues } from "@/lib/schemas/newsletter";

export function NewsletterForm() {
  const { t } = useI18n();
  const schema = useMemo(() => createNewsletterSchema(t), [t]);
  const methods = useForm<NewsletterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", website: "" },
  });
  const { handleSubmit, reset, register, formState } = methods;

  // A validação do cliente é conveniência; o servidor valida de novo, aplica honeypot e é idempotente.
  // Sucesso e falha viram toast; em falha o e-mail digitado é preservado para nova tentativa.
  const onSubmit = handleSubmit(async (values) => {
    const result = await runWithGuards(() => subscribeNewsletter(values));
    if (result.ok) {
      toast.success(t("newsletter.success"));
      reset({ email: "", website: "" });
    } else {
      toast.error(t("newsletter.error.generic"));
    }
  });

  const error = formState.errors.email?.message;

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} noValidate className="flex w-full flex-col items-center gap-2">
        {/* Campo e botão sempre lado a lado (inclusive 360px). Pílula: [ícone][campo][botão] em flex, sem overlay absoluto (o ícone nunca encosta no texto digitado,
            em nenhuma largura). Medidas em rem; texto >= 1rem (sem zoom automático no iOS). */}
        <div className="bg-paper ring-ink/15 focus-within:ring-ink/60 flex w-full items-center overflow-hidden rounded-full shadow-[0_0.125rem_0.375rem_rgb(0_0_0/0.12)] ring-1 focus-within:ring-2">
          <MailIcon aria-hidden="true" className="text-ink/70 ml-4 size-5 shrink-0" />
          <ControlledInput<NewsletterFormValues>
            name="email"
            type="email"
            label={t("newsletter.label")}
            hideLabel
            hideError
            describedBy={error ? "newsletter-error newsletter-consent" : "newsletter-consent"}
            placeholder={t("newsletter.placeholder")}
            autoComplete="email"
            inputMode="email"
            className="min-w-0 flex-1"
            inputClassName="text-ink placeholder:text-ink/70 h-12 rounded-none border-transparent bg-transparent px-3 text-base shadow-none outline-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent md:h-14"
          />
          <Button
            type="submit"
            className="bg-ink text-paper hover:bg-ink/85 active:bg-ink/70 h-12 shrink-0 rounded-full rounded-l-none px-5 text-sm font-semibold md:h-14 md:px-8 tracking-wider uppercase transition-colors"
          >
            {t("newsletter.submit")}
          </Button>
        </div>
        {/* Honeypot: fora da tela e do teclado; pessoas não preenchem. */}
        <div aria-hidden="true" className="absolute -left-[624rem]">
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </div>
        {error && (
          <p id="newsletter-error" role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <p id="newsletter-consent" className="sr-only">
          {t("newsletter.consent")}
        </p>
      </form>
    </FormProvider>
  );
}
