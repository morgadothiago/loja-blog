"use client";

import { useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { subscribeNewsletter } from "@/actions/newsletter";
import { ControlledInput } from "@/components/forms/controlled-input";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { useI18n } from "@/contexts/language-context";
import { runWithGuards } from "@/lib/client-action";
import { translateError } from "@/lib/i18n";
import { createNewsletterSchema, type NewsletterFormValues } from "@/lib/schemas/newsletter";

export function NewsletterForm() {
  const { t } = useI18n();
  const schema = useMemo(() => createNewsletterSchema(t), [t]);
  const [done, setDone] = useState(false);
  const methods = useForm<NewsletterFormValues>({
    resolver: yupResolver(schema),
    defaultValues: { email: "", website: "" },
  });
  const { handleSubmit, setError, register, formState } = methods;

  const onSubmit = handleSubmit(async (values) => {
    const result = await runWithGuards(() => subscribeNewsletter(values));
    if (result.ok) return setDone(true);
    if (result.error.code === "VALIDATION") setError("email", { message: t("newsletter.error.invalid") });
    else setError("root", { message: translateError(t, result.error) });
  });

  if (done) {
    return (
      <p role="status" className="text-lg">
        {t("newsletter.success")}
      </p>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-3 text-left">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <ControlledInput<NewsletterFormValues>
            name="email"
            type="email"
            label={t("newsletter.label")}
            placeholder={t("newsletter.placeholder")}
            autoComplete="email"
            inputMode="email"
            description={t("newsletter.consent")}
            className="min-w-0 flex-1"
            inputClassName="border-ink bg-paper text-ink h-11 rounded-full px-4 text-base md:text-base dark:bg-paper"
          />
          <Button
            type="submit"
            disabled={formState.isSubmitting}
            className="bg-ink text-paper hover:bg-ink/80 h-11 rounded-full px-6 text-sm font-semibold tracking-wider uppercase sm:mt-[1.625rem]"
          >
            {formState.isSubmitting ? t("newsletter.sending") : t("newsletter.submit")}
          </Button>
        </div>
        {/* Honeypot: fora da tela e do teclado; pessoas não preenchem. */}
        <div aria-hidden="true" className="absolute -left-[9999px]">
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </div>
        {formState.errors.root && <FieldError>{formState.errors.root.message}</FieldError>}
      </form>
    </FormProvider>
  );
}
