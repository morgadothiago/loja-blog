"use client";

import { useState } from "react";
import { useI18n } from "@/contexts/language-context";
import { translateError } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ImageUpload({
  name,
  label,
  folder,
  defaultValue = "",
}: {
  name: string;
  label: string;
  folder: "products" | "posts";
  defaultValue?: string;
}) {
  const { t } = useI18n();
  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();

  async function onFile(file?: File) {
    if (!file) return;
    setUploading(true);
    setError(undefined);
    const body = new FormData();
    body.set("file", file);
    body.set("folder", folder);
    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!data.ok) setError(translateError(t, data.error));
      else setUrl(data.data.url);
    } catch {
      setError(translateError(t, { code: navigator.onLine ? "UNAVAILABLE" : "NETWORK" }));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex gap-2">
        <Input id={name} name={name} type="url" value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="https://... ou envie um arquivo" />
        <Button type="button" variant="outline" disabled={uploading}
          onClick={(e) => e.currentTarget.nextElementSibling instanceof HTMLInputElement && e.currentTarget.nextElementSibling.click()}>
          {uploading ? "Enviando..." : "Enviar"}
        </Button>
        <input type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Pré-visualização" className="h-32 w-32 rounded-md border object-cover" />
      )}
    </div>
  );
}
