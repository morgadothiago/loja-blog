import { z } from "zod";
import { dictionaries, type MessageKey } from "@/lib/i18n";

export const EMAIL_MAX = 254;

type Translate = (key: MessageKey) => string;

// Schema Zod do formulário (validação de conveniência no cliente, via zodResolver). A regra de verdade roda de
// novo no servidor (newsletter.server.ts). Mensagens vêm de `t` para seguir o idioma ativo; padrão pt-BR.
export function createNewsletterSchema(t: Translate = (k) => dictionaries["pt-BR"][k]) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, t("newsletter.error.required"))
      .max(EMAIL_MAX, t("newsletter.error.max"))
      .pipe(z.email(t("newsletter.error.invalid"))),
    // Honeypot: campo oculto que pessoas não preenchem.
    website: z.string().default(""),
  });
}

export type NewsletterFormValues = z.input<ReturnType<typeof createNewsletterSchema>>;
