"use client";

import { useActionState } from "react";
import type { Category, Post } from "@prisma/client";
import { FieldMessage, FormError, fieldProps } from "@/components/forms/form-feedback";
import type { Result } from "@/lib/result";
import { ImageUpload } from "@/components/dashboard/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClass =
  "border-input bg-background h-9 w-full rounded-md border px-3 text-sm";

export function PostForm({
  action,
  categories,
  post,
}: {
  action: (prev: Result<never> | undefined, formData: FormData) => Promise<Result<never>>;
  categories: Category[];
  post?: Post;
}) {
  const [result, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="grid max-w-2xl gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" defaultValue={post?.title} required {...fieldProps(result, "title")} />
        <FieldMessage result={result} name="title" id="title-error" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="excerpt">Resumo</Label>
        <Input id="excerpt" name="excerpt" defaultValue={post?.excerpt ?? ""} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="content">Conteúdo</Label>
        <Textarea id="content" name="content" rows={12} defaultValue={post?.content} required {...fieldProps(result, "content")} />
        <FieldMessage result={result} name="content" id="content-error" />
      </div>
      <ImageUpload name="coverUrl" label="Capa" folder="posts" defaultValue={post?.coverUrl ?? ""} />
      <div className="grid gap-2">
        <Label htmlFor="categoryId">Categoria</Label>
        <select id="categoryId" name="categoryId" defaultValue={post?.categoryId ?? ""} className={selectClass}>
          <option value="">Sem categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={post?.published} /> Publicado
      </label>
      <FormError result={result} />
      <Button type="submit" className="w-fit" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>
    </form>
  );
}
