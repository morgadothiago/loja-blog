// Proteção do seed de desenvolvimento: aborta ANTES de tocar no banco se qualquer condição falhar.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]", "db"]);

export function assertDevSeedAllowed(env: Record<string, string | undefined>) {
  if (env.NODE_ENV === "production") throw new Error("Seed de dev recusado: NODE_ENV=production.");
  if (env.ALLOW_DEV_SEED !== "1") throw new Error("Seed de dev recusado: defina ALLOW_DEV_SEED=1 explicitamente.");

  const url = env.DATABASE_URL;
  if (!url) throw new Error("Seed de dev recusado: DATABASE_URL ausente.");
  let host: string;
  let dbName: string;
  try {
    const u = new URL(url);
    host = u.hostname;
    dbName = u.pathname.replace(/^\//, "");
  } catch {
    // Nunca ecoar a URL (tem credenciais).
    throw new Error("Seed de dev recusado: DATABASE_URL inválida.");
  }
  const isLocal = LOCAL_HOSTS.has(host);
  const isDevDb = /(_test|_dev)$/.test(dbName);
  if (!isLocal && !isDevDb) throw new Error("Seed de dev recusado: o banco não é local nem *_dev/*_test.");
}
