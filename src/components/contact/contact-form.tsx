"use client";

import { useActionState, useEffect, useId, useRef, startTransition } from "react";
import { sendContactMessage } from "@/actions/contact";
import { FormError } from "@/components/forms/form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/contexts/language-context";
import { runWithGuards } from "@/lib/client-action";
import { translateFieldError, type MessageKey } from "@/lib/i18n";
import type { Result } from "@/lib/result";
import { CONTACT_LIMITS } from "@/lib/schemas/contact-limits";

// Campos só com linha inferior (como no protótipo), mas com borda a 60% do texto: o contorno do campo
// precisa de 3:1 (WCAG 1.4.11) e `--input` do tema é claro demais para isso.
const fieldClass =
  "bg-transparent rounded-none border-0 border-b border-foreground/60 px-0 text-lg shadow-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-2 aria-invalid:border-destructive aria-invalid:ring-0 md:text-lg dark:bg-transparent";

type FieldName = "name" | "email" | "message";

// Server Action (Zod no servidor é a segurança; atributos HTML são conveniência). Sem reset automático do
// <form>: o envio é feito por onSubmit para NÃO apagar o que a pessoa digitou quando há erro.
export function ContactForm() {
  const { t } = useI18n();
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [result, action, pending] = useActionState(
    (_prev: Result<void> | undefined, formData: FormData) => runWithGuards(() => sendContactMessage(undefined, formData)),
    undefined,
  );

  useEffect(() => {
    if (result?.ok) formRef.current?.reset();
  }, [result]);

  const errors = result && !result.ok ? result.error.fieldErrors : undefined;
  const fields: { name: FieldName; label: MessageKey; type?: string; autoComplete: string; max: number }[] = [
    { name: "name", label: "contact.name", autoComplete: "name", max: CONTACT_LIMITS.name },
    { name: "email", label: "contact.email", type: "email", autoComplete: "email", max: CONTACT_LIMITS.email },
  ];

  return (
    <form
      ref={formRef}
      noValidate
      className="max-w-2xl space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      {fields.map((f) => {
        const error = translateFieldError(t, errors?.[f.name]);
        return (
          <div key={f.name}>
            <label htmlFor={`${id}-${f.name}`} className="text-base font-medium">
              {t(f.label)}
            </label>
            <Input
              id={`${id}-${f.name}`}
              name={f.name}
              type={f.type ?? "text"}
              inputMode={f.type === "email" ? "email" : undefined}
              autoComplete={f.autoComplete}
              maxLength={f.max}
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-${f.name}-error` : undefined}
              className={`${fieldClass} h-12`}
            />
            {error && (
              <p id={`${id}-${f.name}-error`} className="text-destructive mt-1 text-sm">
                {error}
              </p>
            )}
          </div>
        );
      })}
      <div>
        <label htmlFor={`${id}-message`} className="text-base font-medium">
          {t("contact.message")}
        </label>
        <Textarea
          id={`${id}-message`}
          name="message"
          rows={5}
          maxLength={CONTACT_LIMITS.message}
          required
          aria-invalid={errors?.message ? true : undefined}
          aria-describedby={errors?.message ? `${id}-message-error` : undefined}
          className={`${fieldClass} min-h-32 py-3`}
        />
        {errors?.message && (
          <p id={`${id}-message-error`} className="text-destructive mt-1 text-sm">
            {translateFieldError(t, errors.message)}
          </p>
        )}
      </div>
      {/* Honeypot: fora da tela e do teclado; pessoas não preenchem. */}
      <div aria-hidden="true" className="absolute -left-[624rem]">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="text-muted-foreground text-sm">{t("contact.privacy")}</p>
      <FormError result={result} />
      {result?.ok && (
        <p role="status" className="font-hand text-moss text-3xl">
          {t("contact.success")}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-12 px-8 text-base">
        {pending ? t("contact.sending") : t("contact.submit")}
      </Button>
    </form>
  );
}
