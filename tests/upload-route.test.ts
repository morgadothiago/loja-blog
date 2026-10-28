import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));
// Azure é o único serviço de terceiros mockado.
const azure = { configured: true, upload: vi.fn() };
vi.mock("@/lib/azure-blob", () => ({
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  MAX_IMAGE_BYTES: 5 * 1024 * 1024,
  isAzureConfigured: () => azure.configured,
  uploadImage: (...a: unknown[]) => azure.upload(...a),
}));

import { POST } from "@/app/api/upload/route";

const req = (file?: File, extra: Record<string, string> = {}) => {
  const body = new FormData();
  if (file) body.set("file", file);
  for (const [k, v] of Object.entries(extra)) body.set(k, v);
  return new Request("http://localhost/api/upload", { method: "POST", body });
};
const png = new File([new Uint8Array(10)], "a.png", { type: "image/png" });
const asAdmin = () => authMock.mockResolvedValue({ user: { id: "1", role: "ADMIN" } });

beforeEach(() => {
  authMock.mockReset();
  azure.configured = true;
  azure.upload.mockReset();
});

describe("POST /api/upload", () => {
  it("sem sessão 401, cliente 403 (antes de ler o corpo)", async () => {
    authMock.mockResolvedValue(null);
    const r1 = await POST(req(png));
    expect(r1.status).toBe(401);
    expect(await r1.json()).toEqual({ ok: false, error: { code: "UNAUTHENTICATED" } });
    authMock.mockResolvedValue({ user: { id: "2", role: "CUSTOMER" } });
    expect((await POST(req(png))).status).toBe(403);
  });

  it("Azure não configurado -> 503", async () => {
    asAdmin();
    azure.configured = false;
    const r = await POST(req(png));
    expect(r.status).toBe(503);
    expect((await r.json()).error.code).toBe("UNAVAILABLE");
  });

  it("arquivo ausente 422; tipo inválido 422/FILE_TYPE; grande 422/FILE_TOO_LARGE", async () => {
    asAdmin();
    expect((await POST(req())).status).toBe(422);
    const t = await POST(req(new File(["x"], "a.txt", { type: "text/plain" })));
    expect(t.status).toBe(422);
    expect((await t.json()).error.detailCode).toBe("FILE_TYPE");
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "b.png", { type: "image/png" });
    expect((await (await POST(req(big))).json()).error.detailCode).toBe("FILE_TOO_LARGE");
  });

  it("corpo malformado -> 422", async () => {
    asAdmin();
    const r = await POST(new Request("http://localhost/api/upload", { method: "POST", body: "isso não é multipart", headers: { "content-type": "multipart/form-data; boundary=x" } }));
    expect(r.status).toBe(422);
  });

  it("feliz: { ok, data: { url } }; falha do Azure -> 503 sem vazar a causa", async () => {
    asAdmin();
    azure.upload.mockResolvedValueOnce("https://x.blob.core.windows.net/a.png");
    expect(await (await POST(req(png, { folder: "posts" }))).json()).toEqual({ ok: true, data: { url: "https://x.blob.core.windows.net/a.png" } });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    azure.upload.mockRejectedValueOnce(new Error("AccountKey=segredo"));
    const r = await POST(req(png));
    expect(r.status).toBe(503);
    expect(JSON.stringify(await r.json())).not.toContain("segredo");
    spy.mockRestore();
  });
});
