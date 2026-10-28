import { describe, expect, it } from "vitest";
import { authConfig } from "@/auth.config";

type Role = "ADMIN" | "CUSTOMER";
const authorized = authConfig.callbacks.authorized as (args: unknown) => unknown;

function run(path: string, role?: Role) {
  const url = new URL(`http://localhost:3000${path}`);
  const auth = role ? { user: { id: "1", role } } : null;
  return authorized({ auth, request: { nextUrl: url } });
}
const target = (r: unknown) => (r instanceof Response ? new URL(r.headers.get("location")!).pathname : r);

describe("redirecionamento por papel (auth.config)", () => {
  it("admin entra no /dashboard", () => {
    expect(run("/dashboard", "ADMIN")).toBe(true);
    expect(run("/dashboard/posts", "ADMIN")).toBe(true);
  });

  it("cliente em /dashboard vai para /conta", () => {
    expect(target(run("/dashboard", "CUSTOMER"))).toBe("/conta");
  });

  it("sem sessão em /dashboard: não autorizado (o proxy manda para /login)", () => {
    expect(run("/dashboard")).toBe(false);
  });

  it("admin já logado em /login ou /cadastro vai para /dashboard", () => {
    expect(target(run("/login", "ADMIN"))).toBe("/dashboard");
    expect(target(run("/cadastro", "ADMIN"))).toBe("/dashboard");
  });

  it("cliente já logado em /login vai para /conta", () => {
    expect(target(run("/login", "CUSTOMER"))).toBe("/conta");
  });
});
