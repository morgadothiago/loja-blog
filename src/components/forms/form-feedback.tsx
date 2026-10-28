"use client";

import { useI18n } from "@/contexts/language-context";
import { translateError, translateFieldError } from "@/lib/i18n";
import type { Result } from "@/lib/result";

// Erro geral do formulário (role=alert). Em VALIDATION a mensagem geral é curta; o detalhe vai no campo.
export function FormError({ result }: { result: Result<unknown> | undefined }) {
  const { t } = useI18n();
  if (!result || result.ok) return null;
  return (
    <p role="alert" className="text-destructive text-sm">
      {translateError(t, result.error)}
    </p>
  );
}

// Mensagem de um campo; `id` deve ser referenciado em aria-describedby do input.
export function FieldMessage({ result, name, id }: { result: Result<unknown> | undefined; name: string; id: string }) {
  const { t } = useI18n();
  if (!result || result.ok) return null;
  const msg = translateFieldError(t, result.error.fieldErrors?.[name]);
  return msg ? (
    <p id={id} className="text-destructive text-sm">
      {msg}
    </p>
  ) : null;
}

export const fieldProps = (result: Result<unknown> | undefined, name: string) => {
  const bad = !!result && !result.ok && !!result.error.fieldErrors?.[name];
  return { "aria-invalid": bad || undefined, "aria-describedby": bad ? `${name}-error` : undefined } as const;
};
