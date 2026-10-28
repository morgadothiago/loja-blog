"use client";

import { useState } from "react";
import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { useI18n } from "@/contexts/language-context";
import { runWithGuards } from "@/lib/client-action";
import { translateError } from "@/lib/i18n";
import type { Result } from "@/lib/result";

// Envio comum dos formulários de auth: guarda de rede/timeout e mapeamento do erro tipado.
// Erro: toast (visível mesmo se o foco estiver longe) + aviso inline com role=alert (acessível,
// fica na tela). EMAIL_TAKEN também marca o campo. Sucesso = redirect do servidor (a chamada não
// retorna); o toast de sucesso vem do cookie "flash" lido na página de destino (FlashToast).
export function useAuthSubmit<T extends FieldValues>(setError: UseFormSetError<T>) {
  const { t } = useI18n();
  const [formError, setFormError] = useState<string>();

  async function submit(call: () => Promise<Result<unknown>>) {
    setFormError(undefined);
    const result = await runWithGuards(call);
    if (result.ok) return;
    const message = translateError(t, result.error);
    if (result.error.detailCode === "EMAIL_TAKEN") {
      setError("email" as FieldPath<T>, { message });
    } else {
      setFormError(message);
    }
    toast.error(message);
  }
  return { submit, formError };
}
