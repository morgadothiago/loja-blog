import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { assertDevSeedAllowed } from "./seed-guard";

// Usuários de DESENVOLVIMENTO/TESTE (senhas documentadas na spec 0002; nunca usar em produção).
// Determinístico e idempotente (upsert por e-mail). Não imprime senhas.
export const DEV_USERS = [
  { email: "admin@example.com", name: "Admin (dev)", role: "ADMIN", password: "Admin@12345", disabledAt: null },
  { email: "cliente@example.com", name: "Cliente (dev)", role: "CUSTOMER", password: "Cliente@12345", disabledAt: null },
  { email: "cliente2@example.com", name: "Cliente 2 (dev)", role: "CUSTOMER", password: "Cliente2@12345", disabledAt: null },
  { email: "desativado@example.com", name: "Desativado (dev)", role: "CUSTOMER", password: "Desativado@12345", disabledAt: new Date("2025-01-01T00:00:00.000Z") },
] as const;

export async function seedDevUsers(db: PrismaClient) {
  for (const u of DEV_USERS) {
    const password = await hashPassword(u.password);
    await db.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, password, disabledAt: u.disabledAt },
      create: { email: u.email, name: u.name, role: u.role, password, disabledAt: u.disabledAt },
    });
  }
}

async function main() {
  assertDevSeedAllowed(process.env);
  const db = new PrismaClient();
  try {
    await seedDevUsers(db);
    console.log(`Seed de dev: ${DEV_USERS.length} usuários (admin, cliente, cliente2, desativado).`);
  } finally {
    await db.$disconnect();
  }
}

// Só executa como script (importável nos testes sem efeitos).
if (process.argv[1]?.endsWith("seed.ts")) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : "Seed falhou.");
    process.exit(1);
  });
}
