import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import { auth } from "@/auth";
import { logError, mapError } from "@/lib/errors";
import { fail, ok, type Result } from "@/lib/result";

export type ActionUser = { id: string; role?: string; name?: string | null };
type Ctx = { user: ActionUser | null };
type Config<S extends z.ZodType> = {
  /** Nome para o log do servidor. */
  name: string;
  auth: "public" | "user" | "admin";
  schema: S;
};

// Ordem fixa: autenticação/papel -> validação -> handler -> mapeamento de erros.
// redirect()/notFound() dentro do handler são relançados (unstable_rethrow), não viram erro.
async function run<S extends z.ZodType, T>(
  cfg: Config<S>,
  raw: unknown,
  handler: (input: z.infer<S>, ctx: Ctx) => Promise<T>,
  extra: unknown[] = [],
): Promise<Result<T>> {
  let userId: string | undefined;
  try {
    let user: ActionUser | null = null;
    if (cfg.auth !== "public") {
      const session = await auth();
      if (!session?.user?.id) return fail("UNAUTHENTICATED");
      user = { id: session.user.id, role: session.user.role, name: session.user.name };
      userId = user.id;
      if (cfg.auth === "admin" && user.role !== "ADMIN") return fail("FORBIDDEN");
    }
    const input = cfg.schema.parse(raw);
    return ok(await (handler as (i: z.infer<S>, c: Ctx, ...e: unknown[]) => Promise<T>)(input, { user }, ...extra));
  } catch (e) {
    unstable_rethrow(e);
    const error = mapError(e);
    if (error.code === "INTERNAL" || error.code === "UNAVAILABLE") logError(e, { action: cfg.name, userId });
    return { ok: false, error };
  }
}

// Ação chamada com um valor (ex.: id): `deletePost(id)`.
export function defineAction<S extends z.ZodType, T>(
  cfg: Config<S>,
  handler: (input: z.infer<S>, ctx: Ctx) => Promise<T>,
) {
  return async (input: unknown): Promise<Result<T>> => run(cfg, input, handler);
}

// Ação de <form> para useActionState: (…argsVinculados, estadoAnterior, formData).
// `bind(null, id)` fornece os argumentos iniciais; eles chegam ao handler depois de `ctx`.
export function defineFormAction<A extends unknown[], S extends z.ZodType, T>(
  cfg: Config<S>,
  handler: (input: z.infer<S>, ctx: Ctx, ...bound: A) => Promise<T>,
) {
  return async (...args: [...A, Result<T> | undefined, FormData]): Promise<Result<T>> => {
    // Os 2 últimos são sempre (estado anterior, formData); o resto são os vinculados.
    const formData = args[args.length - 1] as FormData;
    const bound = args.slice(0, -2);
    return run(cfg, Object.fromEntries(formData), handler as never, bound);
  };
}
