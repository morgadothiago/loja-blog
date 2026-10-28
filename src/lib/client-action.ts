import type { Result } from "@/lib/result";

// Chama uma Server Action no cliente garantindo um Result: offline -> NETWORK, rejeição
// (fetch falhou) -> NETWORK, demora -> TIMEOUT. Nunca rejeita.
export async function runWithGuards<T>(call: () => Promise<Result<T>>, timeoutMs = 15000): Promise<Result<T>> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { ok: false, error: { code: "NETWORK" } };
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<Result<T>>((resolve) => {
    timer = setTimeout(() => resolve({ ok: false, error: { code: "TIMEOUT" } }), timeoutMs);
  });
  try {
    return await Promise.race([call(), timeout]);
  } catch (e) {
    // redirect() do servidor chega como rejeição especial: quem chama precisa vê-la.
    if (isNextControlFlow(e)) throw e;
    return { ok: false, error: { code: "NETWORK" } };
  } finally {
    clearTimeout(timer);
  }
}

function isNextControlFlow(e: unknown) {
  const digest = (e as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK"));
}
