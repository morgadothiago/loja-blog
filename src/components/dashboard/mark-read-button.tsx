"use client";

import { Button } from "@/components/ui/button";
import { useServerAction } from "@/hooks/use-server-action";
import type { Result } from "@/lib/result";

// Marca a mensagem como lida; o erro vira toast traduzido (useServerAction). A lista revalida na action.
export function MarkReadButton({ action }: { action: () => Promise<Result> }) {
  const { run, pending } = useServerAction();
  return (
    <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => run(action)}>
      Marcar como lida
    </Button>
  );
}
