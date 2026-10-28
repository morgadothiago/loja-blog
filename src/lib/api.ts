import { NextResponse } from "next/server";
import { HTTP_STATUS, type ErrorCode } from "@/lib/result";

// Resposta de erro padrão das rotas de API: { ok:false, error:{ code, detailCode? } }.
export function jsonError(code: ErrorCode, detailCode?: string, init?: ResponseInit) {
  return NextResponse.json(
    { ok: false, error: { code, ...(detailCode && { detailCode }) } },
    { status: HTTP_STATUS[code], ...init },
  );
}
