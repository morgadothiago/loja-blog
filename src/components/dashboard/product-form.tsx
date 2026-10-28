"use client";

import { useActionState } from "react";
import type { Category, Product } from "@prisma/client";
import { FieldMessage, FormError, fieldProps } from "@/components/forms/form-feedback";
import type { Result } from "@/lib/result";
import { ImageUpload } from "@/components/dashboard/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClass =
  "border-input bg-background h-9 w-full rounded-md border px-3 text-sm";

export function ProductForm({
  action,
  categories,
  product,
}: {
  action: (prev: Result<never> | undefined, formData: FormData) => Promise<Result<never>>;
  categories: Category[];
  product?: Product;
}) {
  const [result, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="grid max-w-xl gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={product?.name} required {...fieldProps(result, "name")} />
        <FieldMessage result={result} name="name" id="name-error" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" defaultValue={product?.description} required {...fieldProps(result, "description")} />
        <FieldMessage result={result} name="description" id="description-error" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="price">Preço (R$)</Label>
          <Input id="price" name="price" type="number" step="0.01" min="0"
            defaultValue={product ? product.priceCents / 100 : 0} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="stock">Estoque</Label>
          <Input id="stock" name="stock" type="number" min="0" defaultValue={product?.stock ?? 0} required />
        </div>
      </div>
      <ImageUpload name="imageUrl" label="Imagem" folder="products" defaultValue={product?.imageUrl ?? ""} />
      <div className="grid gap-2">
        <Label htmlFor="categoryId">Categoria</Label>
        <select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ""} className={selectClass}>
          <option value="">Sem categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={product?.published} /> Publicado
      </label>
      <FormError result={result} />
      <Button type="submit" className="w-fit" disabled={pending}>{pending ? "Salvando..." : "Salvar"}</Button>
    </form>
  );
}
