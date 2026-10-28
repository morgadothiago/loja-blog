"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { useI18n } from "@/contexts/language-context";
import { runWithGuards } from "@/lib/client-action";
import { translateError } from "@/lib/i18n";
import type { ActionError, Result } from "@/lib/result";

// Executa uma ação com pending, timeout/offline e toast de erro traduzido.
export function useServerAction() {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<ActionError>();

  const run = useCallback(
    <T,>(call: () => Promise<Result<T>>, opts?: { successMessage?: string; onSuccess?: (data: T) => void; toastError?: boolean }) =>
      new Promise<Result<T>>((resolve) => {
        startTransition(async () => {
          const result = await runWithGuards(call);
          if (result.ok) {
            setError(undefined);
            if (opts?.successMessage) toast.success(opts.successMessage);
            opts?.onSuccess?.(result.data);
          } else {
            setError(result.error);
            if (opts?.toastError !== false) toast.error(translateError(t, result.error));
          }
          resolve(result);
        });
      }),
    [t],
  );

  return { run, pending, error };
}
