import { Prisma } from "@prisma/client";
import { AuthError } from "next-auth";
import { ZodError } from "zod";
import type { ActionError, ErrorCode, FieldErrorCode } from "@/lib/result";

// Erro de regra de negócio esperado (estoque, carrinho...): vira resultado, não 500.
export class BusinessError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly detailCode: string,
  ) {
    super(detailCode);
    this.name = "BusinessError";
  }
}

function fieldCode(issue: ZodError["issues"][number]): FieldErrorCode {
  if (issue.code === "too_small") {
    const min = (issue as { minimum?: number | bigint }).minimum;
    const origin = (issue as { origin?: string }).origin;
    if (origin === "string") return min === 1 || min === 0 ? "REQUIRED" : "TOO_SHORT";
    return "TOO_SMALL";
  }
  if (issue.code === "too_big") return "TOO_LONG";
  if (issue.code === "invalid_type" && (issue as { input?: unknown }).input === undefined) return "REQUIRED";
  return "INVALID";
}

const UNAVAILABLE_PRISMA = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);

// Pura e testável: converte qualquer exceção em um código estável. Nada de `message` sai daqui.
export function mapError(e: unknown): ActionError {
  if (e instanceof ZodError) {
    const fieldErrors: Record<string, FieldErrorCode> = {};
    for (const issue of e.issues) {
      const key = issue.path.join(".") || "_";
      fieldErrors[key] ??= fieldCode(issue);
    }
    return { code: "VALIDATION", fieldErrors };
  }
  if (e instanceof BusinessError) return { code: e.code, detailCode: e.detailCode };
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") {
      const target = Array.isArray(e.meta?.target) ? String(e.meta?.target[0]) : String(e.meta?.target ?? "");
      return { code: "CONFLICT", detailCode: target.includes("email") ? "EMAIL_TAKEN" : "SLUG_TAKEN" };
    }
    if (e.code === "P2003") return { code: "CONFLICT", detailCode: "IN_USE" };
    if (e.code === "P2025") return { code: "NOT_FOUND" };
    if (UNAVAILABLE_PRISMA.has(e.code)) return { code: "UNAVAILABLE" };
  }
  if (e instanceof Prisma.PrismaClientInitializationError) return { code: "UNAVAILABLE" };
  if (e instanceof AuthError) {
    if ((e as { code?: string }).code === "rate_limited") return { code: "RATE_LIMITED" };
    return e.type === "CredentialsSignin"
      ? { code: "UNAUTHENTICATED", detailCode: "INVALID_CREDENTIALS" }
      : { code: "INTERNAL" };
  }
  return { code: "INTERNAL" };
}

// Só falhas inesperadas chegam aqui. Nunca registra entrada do usuário (e-mail, senha, corpo)
// nem valores de Prisma: para P2xxx só o código e o campo (meta.target).
export function logError(e: unknown, ctx: { action: string; userId?: string }) {
  let detail: Record<string, unknown>;
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    detail = { name: e.name, prismaCode: e.code, target: e.meta?.target };
  } else if (e instanceof Error) {
    detail = { name: e.name, message: e.message, stack: e.stack };
  } else {
    detail = { name: typeof e };
  }
  console.error(JSON.stringify({ level: "error", ...ctx, ...detail }));
}
