"use client";

import { useState } from "react";
import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import { useI18n } from "@/contexts/language-context";
import { runWithGuards } from "@/lib/client-action";
import { translateError } from "@/lib/i18n";
import type { Result } from "@/lib/result";

// Envio comum dos formulários de auth: guarda de rede/timeout e mapeamento do erro tipado
// para o campo (EMAIL_TAKEN) ou para o aviso geral (credencial inválida, rate limit...).
// Sucesso = redirect do servidor (a chamada não retorna: o Next navega).
export function useAuthSubmit<T extends FieldValues>(setError: UseFormSetError<T>) {
  const { t } = useI18n();
  const [formError, setFormError] = useState<string>();

  async function submit(call: () => Promise<Result<unknown>>) {
    setFormError(undefined);
    const result = await runWithGuards(call);
    if (result.ok) return;
    if (result.error.detailCode === "EMAIL_TAKEN") {
      setError("email" as FieldPath<T>, { message: translateError(t, result.error) });
    } else {
      setFormError(translateError(t, result.error));
    }
  }
  return { submit, formError };
}
