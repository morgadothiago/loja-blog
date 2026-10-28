import { BlobServiceClient, type ContainerClient } from "@azure/storage-blob";
import { randomUUID } from "node:crypto";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

let container: Promise<ContainerClient> | undefined;

export function isAzureConfigured() {
  return !!process.env.AZURE_STORAGE_CONNECTION_STRING;
}

function getContainer() {
  container ??= (async () => {
    const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!conn) throw new Error("AZURE_STORAGE_CONNECTION_STRING não configurada");
    const client = BlobServiceClient.fromConnectionString(conn).getContainerClient(
      process.env.AZURE_STORAGE_CONTAINER ?? "uploads",
    );
    // acesso "blob": arquivos legíveis por URL, listagem do container continua privada
    await client.createIfNotExists({ access: "blob" });
    return client;
  })();
  container.catch(() => (container = undefined)); // permite nova tentativa após falha
  return container;
}

export async function uploadImage(file: File, folder: "products" | "posts") {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const blob = (await getContainer()).getBlockBlobClient(`${folder}/${randomUUID()}.${ext}`);
  await blob.uploadData(Buffer.from(await file.arrayBuffer()), {
    blobHTTPHeaders: { blobContentType: file.type, blobCacheControl: "public, max-age=31536000" },
  });
  return blob.url;
}
