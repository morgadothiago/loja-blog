"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/language-context";
import { useServerAction } from "@/hooks/use-server-action";
import type { Result } from "@/lib/result";

// Confirmação antes de excluir + toast de sucesso/erro (prevenção de erro, spec 0003).
export function DeleteButton({ action }: { action: () => Promise<Result> }) {
  const { t } = useI18n();
  const { run, pending } = useServerAction();
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button type="button" variant="destructive" size="sm" />}>
        {t("confirm.delete.confirm")}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirm.delete.title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("confirm.delete.text")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("confirm.cancel")}</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={async () => {
              const result = await run(action, { successMessage: t("toast.deleted") });
              if (result.ok || result.error.code !== "NETWORK") setOpen(false);
            }}
          >
            {t("confirm.delete.confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
