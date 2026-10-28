import { afterEach, describe, expect, it, vi } from "vitest";
import { runWithGuards } from "@/lib/client-action";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("runWithGuards", () => {
  it("devolve o resultado da ação", async () => {
    expect(await runWithGuards(async () => ({ ok: true, data: 1 }))).toEqual({ ok: true, data: 1 });
  });

  it("offline -> NETWORK sem chamar a ação", async () => {
    vi.stubGlobal("navigator", { onLine: false });
    const call = vi.fn();
    expect(await runWithGuards(call)).toEqual({ ok: false, error: { code: "NETWORK" } });
    expect(call).not.toHaveBeenCalled();
  });

  it("rejeição (rede) -> NETWORK; nunca rejeita", async () => {
    expect(await runWithGuards(() => Promise.reject(new TypeError("Failed to fetch")))).toEqual({ ok: false, error: { code: "NETWORK" } });
  });

  it("demora -> TIMEOUT", async () => {
    vi.useFakeTimers();
    const p = runWithGuards(() => new Promise(() => {}), 1000);
    await vi.advanceTimersByTimeAsync(1001);
    expect(await p).toEqual({ ok: false, error: { code: "TIMEOUT" } });
  });

  it("redirect do servidor é relançado, não vira erro de rede", async () => {
    const redirectError = Object.assign(new Error("NEXT_REDIRECT"), { digest: "NEXT_REDIRECT;push;/x;307;" });
    await expect(runWithGuards(() => Promise.reject(redirectError))).rejects.toBe(redirectError);
  });
});
