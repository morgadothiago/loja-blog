import * as yup from "yup";
import { dictionaries, type MessageKey } from "@/lib/i18n";
import { PASSWORD_MAX_BYTES, PASSWORD_MIN, passwordBytes } from "@/lib/password";

type Translate = (key: MessageKey) => string;
const ptBR: Translate = (k) => dictionaries["pt-BR"][k];

// Schemas yup dos formulários (conveniência de UX). A regra de verdade é a do servidor
// (auth.server.ts, Zod). Mensagens via `t` (pt-BR por padrão).
const emailField = (t: Translate) =>
  yup.string().trim().required(t("auth.error.emailRequired")).max(254, t("newsletter.error.max")).email(t("newsletter.error.invalid"));

const maxBytes = () => (v: string | undefined) => passwordBytes(v ?? "") <= PASSWORD_MAX_BYTES || false;

export function createLoginSchema(t: Translate = ptBR) {
  return yup.object({
    email: emailField(t),
    password: yup.string().required(t("auth.error.passwordRequired")).test("max-bytes", t("auth.error.passwordMax"), maxBytes()),
  });
}

export function createRegisterSchema(t: Translate = ptBR) {
  return yup.object({
    name: yup.string().trim().required(t("auth.error.nameRequired")).min(2, t("auth.error.nameShort")).max(100, t("auth.error.nameLong")),
    email: emailField(t),
    password: yup
      .string()
      .required(t("auth.error.passwordRequired"))
      .min(PASSWORD_MIN, t("auth.error.passwordShort"))
      .test("max-bytes", t("auth.error.passwordMax"), maxBytes()),
  });
}

export type LoginFormValues = yup.InferType<ReturnType<typeof createLoginSchema>>;
export type RegisterFormValues = yup.InferType<ReturnType<typeof createRegisterSchema>>;
