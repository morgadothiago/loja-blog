"use client";

import { useMemo } from "react";
import { MailIcon } from "lucide-react";
import { toast } from "sonner";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ControlledInput } from "@/components/forms/controlled-input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/language-context";
import { createNewsletterSchema, type NewsletterFormValues } from "@/lib/schemas/newsletter";

export function NewsletterForm() {
  const { t } = useI18n();
  const schema = useMemo(() => createNewsletterSchema(t), [t]);
  const methods = useForm<NewsletterFormValues>({
    resolver: yupResolver(schema),
    defaultValues: { email: "", website: "" },
  });
  const { handleSubmit, reset, register, formState } = methods;

  // Por enquanto, e-mail válido só dispara um toast (sem gravar): subscribeNewsletter fica pronta
  // em src/actions/newsletter.ts para ligar aqui quando o banco entrar.
  const onSubmit = handleSubmit(() => {
    toast.success(t("newsletter.success"));
    reset({ email: "", website: "" });
  });

  const error = formState.errors.email?.message;

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} noValidate className="flex w-full flex-col items-center gap-2">
        {/* Campo e botão SEMPRE lado a lado (inclusive 360px), como no layout aprovado. O rótulo é
            só para leitores de tela; o consentimento e o erro ficam abaixo, discretos, para não
            espremer a linha. */}
        <div className="group bg-paper ring-ink/15 relative flex w-full items-center overflow-hidden rounded-full shadow-[0_0.125rem_0.375rem_rgb(0_0_0/0.12)] ring-1">
          {/* Vazio: ícone + "Digite seu e-mail" centralizados juntos (overlay; o placeholder real fica
              transparente, mas segue existindo para leitores de tela e :placeholder-shown). Com texto
              digitado: o ícone vai para a esquerda e o texto fica centralizado. */}
          <div className="group/field relative min-w-0 flex-1 justify-center ">
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
              inputClassName="border-transparent bg-transparent text-ink h-11 md:h-14 rounded-l-full rounded-r-none pr-4 pl-1 text-left text-sm md:pl-[calc(2.1875rem+1.8cqw)]  md:text-[1.4cqw] shadow-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink/60 placeholder:text-transparent dark:bg-transparent"
            />
            <div
              aria-hidden="true"
              className="text-ink/55 group-focus-within/field:text-ink pointer-events-none absolute inset-0 hidden items-center justify-start pl-5 gap-0 text-xs whitespace-nowrap sm:text-sm transition-colors group-has-[input:placeholder-shown]/field:flex md:text-[1.4cqw]"
            >
              <MailIcon className="size-4 md:size-[1.8cqw]" />
              <span>{t("newsletter.placeholder")}</span>
            </div>
            <MailIcon
              aria-hidden="true"
              className="text-ink/50 group-focus-within/field:text-ink pointer-events-none absolute top-1/2  size-4 -translate-y-1/2 transition-colors group-has-[input:placeholder-shown]/field:hidden md:size-[1.8cqw] p"
            />
          </div>
          <Button
            type="submit"
            className="bg-ink text-paper hover:bg-ink/85 active:bg-ink/70 h-11 md:h-14 shrink-0 rounded-full rounded-l-none px-4 text-xs sm:px-6 md:px-[2.6cqw] md:text-[1.3cqw] font-semibold tracking-wider uppercase transition-colors"
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
