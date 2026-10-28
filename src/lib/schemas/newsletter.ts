import * as yup from "yup";
import { dictionaries, type MessageKey } from "@/lib/i18n";

export const EMAIL_MAX = 254;

type Translate = (key: MessageKey) => string;

// Schema yup do formulário (validação de conveniência no cliente).
// A regra de verdade roda de novo no servidor (newsletter.server.ts, Zod).
// Mensagens vêm de `t` para seguir o idioma ativo; o padrão é pt-BR.
export function createNewsletterSchema(t: Translate = (k) => dictionaries["pt-BR"][k]) {
  return yup.object({
    email: yup
      .string()
      .trim()
      .required(t("newsletter.error.required"))
      .max(EMAIL_MAX, t("newsletter.error.max"))
      .email(t("newsletter.error.invalid")),
    // Honeypot: campo oculto que pessoas não preenchem.
    website: yup.string().default(""),
  });
}

export type NewsletterFormValues = yup.InferType<ReturnType<typeof createNewsletterSchema>>;
