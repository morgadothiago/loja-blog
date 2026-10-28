import { execSync } from "node:child_process";
import { TEST_DATABASE_URL } from "./test-env";

// Aplica as migrations no banco *_test (docker: `npm run db:up`; criar o banco uma vez:
// docker compose exec -T db psql -U loja -d postgres -c "CREATE DATABASE loja_blog_test").
export default function setup() {
  execSync("npx prisma migrate deploy", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
