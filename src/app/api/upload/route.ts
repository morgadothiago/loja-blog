import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { jsonError } from "@/lib/api";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, isAzureConfigured, uploadImage } from "@/lib/azure-blob";
import { logError } from "@/lib/errors";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return jsonError("UNAUTHENTICATED");
  if (session.user.role !== "ADMIN") return jsonError("FORBIDDEN");

  if (!isAzureConfigured()) return jsonError("UNAVAILABLE");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError("VALIDATION"); // corpo malformado
  }
  const file = form.get("file");
  const folder = form.get("folder") === "posts" ? "posts" : "products";

  if (!(file instanceof File)) return jsonError("VALIDATION");
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return jsonError("VALIDATION", "FILE_TYPE");
  if (file.size > MAX_IMAGE_BYTES) return jsonError("VALIDATION", "FILE_TOO_LARGE");

  try {
    return NextResponse.json({ ok: true, data: { url: await uploadImage(file, folder) } });
  } catch (e) {
    logError(e, { action: "upload", userId: session.user.id });
    return jsonError("UNAVAILABLE");
  }
}
