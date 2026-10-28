import bcrypt from "bcryptjs";

// Custo do bcrypt em um só lugar (app e seed usam o mesmo hash).
export const BCRYPT_COST = 10;
export const PASSWORD_MIN = 8;
// bcrypt só considera os primeiros 72 bytes; limitar também evita CPU gasta com senhas enormes.
export const PASSWORD_MAX_BYTES = 72;

export const passwordBytes = (value: string) => new TextEncoder().encode(value).length;

export const hashPassword = (plain: string) => bcrypt.hash(plain, BCRYPT_COST);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

// Hash fixo (custo igual ao real) de uma senha aleatória descartada: comparar contra ele quando o
// usuário não existe iguala o tempo de resposta e evita enumeração por tempo.
export const DUMMY_HASH = "$2b$10$i/cEepScPhoPb.A/PKVcfu.HH4W.KTH6RlvECQTW9arHd.Je.5RSW";
