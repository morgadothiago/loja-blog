import { describe, expect, it } from "vitest";
import { safeCallbackPath } from "@/lib/safe-path";

describe("safeCallbackPath", () => {
  it.each(["/carrinho", "/loja/produto?x=1#a", "/"])("aceita caminho interno %s", (v) => {
    expect(safeCallbackPath(v)).toBe(v);
  });

  it.each([
    "https://evil.com", "http://evil.com/carrinho", "//evil.com", "/\\evil.com", "\\\\evil.com",
    "carrinho", "", "javascript:alert(1)", "/ok\r\nLocation: http://evil.com", "/a\tb", null, undefined, 42, {},
    "/" + "a".repeat(3000),
  ])("rejeita %j", (v) => {
    expect(safeCallbackPath(v)).toBeNull();
  });
});
