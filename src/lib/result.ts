// Contrato único de resultado para Server Actions e rotas de API (spec 0003).
// A mensagem exibida é sempre a tradução do código no cliente: nenhum texto livre
// (e nenhum detalhe interno) atravessa a fronteira servidor -> cliente.
export type ErrorCode =
  | "VALIDATION" // 422 (fieldErrors presente)
  | "UNAUTHENTICATED" // 401
  | "FORBIDDEN" // 403
  | "NOT_FOUND" // 404
  | "CONFLICT" // 409 duplicado, estoque, registro em uso
  | "RATE_LIMITED" // 429
  | "UNAVAILABLE" // 503 banco/serviço externo
  | "INTERNAL" // 500
  | "NETWORK" // só cliente: sem conexão
  | "TIMEOUT"; // só cliente

export type FieldErrorCode = "REQUIRED" | "INVALID" | "TOO_SHORT" | "TOO_LONG" | "TOO_SMALL";

export type ActionError = {
  code: ErrorCode;
  /** Código de negócio específico (ex.: OUT_OF_STOCK, EMAIL_TAKEN). Nunca texto livre. */
  detailCode?: string;
  fieldErrors?: Record<string, FieldErrorCode>;
};

export type Result<T = void> = { ok: true; data: T } | { ok: false; error: ActionError };

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });
export const fail = (code: ErrorCode, detailCode?: string): Result<never> => ({
  ok: false,
  error: { code, ...(detailCode && { detailCode }) },
});

export const HTTP_STATUS: Record<ErrorCode, number> = {
  VALIDATION: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  UNAVAILABLE: 503,
  INTERNAL: 500,
  NETWORK: 503,
  TIMEOUT: 504,
};
