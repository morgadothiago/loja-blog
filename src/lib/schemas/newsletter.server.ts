import { z } from "zod";

// Fonte da verdade da validação (o cliente usa yup só para UX).
export const newsletterInputSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  website: z.string().max(200).optional(),
});
