import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

// Cria (ou atualiza) um ADMIN no banco apontado por DATABASE_URL. Uso:
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... [ADMIN_NAME=...] npx tsx prisma/create-admin.ts
// Para ambientes de teste/staging sem seed. Não imprime a senha.
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Admin";

  if (!email || !email.includes("@")) throw new Error("Defina ADMIN_EMAIL com um e-mail válido.");
  if (!password || Buffer.byteLength(password) < 12 || Buffer.byteLength(password) > 72) {
    throw new Error("ADMIN_PASSWORD deve ter entre 12 e 72 bytes.");
  }

  const db = new PrismaClient();
  try {
    const hashed = await hashPassword(password);
    await db.user.upsert({
      where: { email },
      update: { name, role: "ADMIN", password: hashed, disabledAt: null },
      create: { email, name, role: "ADMIN", password: hashed },
    });
    console.log(`Admin pronto: ${email}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Falhou ao criar o admin.");
  process.exit(1);
});
