"use client";

import { useActionState } from "react";
import { createCategory } from "@/actions/categories";
import { FieldMessage, FormError, fieldProps } from "@/components/forms/form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CategoryForm() {
  const [result, action, pending] = useActionState(createCategory, undefined);
  return (
    <form action={action} className="grid max-w-xl gap-2">
      <div className="flex gap-2">
        <Input name="name" placeholder="Nome da categoria" required aria-label="Nome da categoria" {...fieldProps(result, "name")} />
        <select name="kind" aria-label="Tipo" className="border-input bg-background h-9 rounded-md border px-3 text-sm">
          <option value="PRODUCT">Produto</option>
          <option value="POST">Blog</option>
        </select>
        <Button type="submit" disabled={pending}>Adicionar</Button>
      </div>
      <FieldMessage result={result} name="name" id="name-error" />
      <FormError result={result} />
    </form>
  );
}
