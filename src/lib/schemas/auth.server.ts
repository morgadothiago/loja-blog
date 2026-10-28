import { z } from "zod";
import { PASSWORD_MAX_BYTES, PASSWORD_MIN, passwordBytes } from "@/lib/password";

const email = z.string().trim().toLowerCase().max(254).pipe(z.email());
const callbackUrl = z.string().max(2048).optional();

// Login: sem mínimo de senha (contas antigas podem ter 6-7 caracteres); só o teto de bytes.
export const loginServerSchema = z.object({
  email,
  password: z.string().min(1).refine((v) => passwordBytes(v) <= PASSWORD_MAX_BYTES),
  callbackUrl,
});

// Cadastro: 8 a 72 bytes (a regra nova vale só aqui).
export const registerServerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password: z.string().min(PASSWORD_MIN).refine((v) => passwordBytes(v) <= PASSWORD_MAX_BYTES),
  callbackUrl,
});
