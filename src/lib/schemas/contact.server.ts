import { z } from "zod";
import { CONTACT_LIMITS } from "@/lib/schemas/contact-limits";

// Fonte da verdade da validação do contato (o cliente só repete limites via atributos HTML).
export const contactInputSchema = z.object({
  name: z.string().trim().min(1).max(CONTACT_LIMITS.name),
  email: z.string().trim().toLowerCase().max(CONTACT_LIMITS.email).pipe(z.email()),
  message: z.string().trim().min(1).max(CONTACT_LIMITS.message),
  // Honeypot: campo escondido que pessoas não preenchem.
  website: z.string().max(200).optional(),
});
