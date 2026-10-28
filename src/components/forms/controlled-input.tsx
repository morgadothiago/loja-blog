"use client";

import { useId, useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import {
  useController,
  useFormContext,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ControlledInputProps<T extends FieldValues> = Omit<
  React.ComponentProps<"input">,
  "name" | "value" | "defaultValue" | "onChange" | "onBlur" | "ref"
> & {
  name: FieldPath<T>;
  label: string;
  description?: string;
  // Layouts compactos (ex.: campo ao lado de um botão): o erro é mostrado fora do campo, por quem chama;
  // `describedBy` acrescenta os ids dessas mensagens ao aria-describedby do input.
  hideError?: boolean;
  describedBy?: string;
  // Opcional: sem ele, usa o FormProvider mais próximo.
  control?: Control<T>;
  hideLabel?: boolean;
  inputClassName?: string;
  // Campo de senha com botão mostrar/ocultar (nomes acessíveis já traduzidos por quem chama).
  reveal?: { show: string; hide: string };
};

// Input ligado ao react-hook-form por useController: label visível,
// mensagem de erro associada via aria-describedby e aria-invalid.
export function ControlledInput<T extends FieldValues>({
  name,
  label,
  description,
  hideError,
  describedBy: extraDescribedBy,
  control,
  hideLabel,
  type = "text",
  className,
  inputClassName,
  reveal,
  ...inputProps
}: ControlledInputProps<T>) {
  const ctx = useFormContext<T>();
  const { field, fieldState } = useController<T>({ name, control: control ?? ctx.control });
  const id = useId();
  const [shown, setShown] = useState(false);
  const errorId = `${id}-error`;
  const descId = `${id}-desc`;
  const describedBy = [!hideError && fieldState.error && errorId, description && descId, extraDescribedBy].filter(Boolean).join(" ");

  return (
    <Field data-invalid={fieldState.invalid || undefined} className={className}>
      <FieldLabel htmlFor={id} className={cn(hideLabel && "sr-only")}>
        {label}
      </FieldLabel>
      <div className="relative">
        <Input
          {...inputProps}
          {...field}
          value={field.value ?? ""}
          id={id}
          type={reveal && shown ? "text" : type}
          aria-invalid={fieldState.invalid || undefined}
          aria-describedby={describedBy || undefined}
          className={cn(reveal && "pr-12", inputClassName)}
        />
        {reveal && (
          <button
            type="button"
            onClick={() => setShown((v) => !v)}
            aria-label={shown ? reveal.hide : reveal.show}
            aria-pressed={shown}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-0 flex size-11 -translate-y-1/2 items-center justify-center rounded-full outline-none focus-visible:ring-2"
          >
            {shown ? <EyeOffIcon className="size-5" aria-hidden="true" /> : <EyeIcon className="size-5" aria-hidden="true" />}
          </button>
        )}
      </div>
      {description && <FieldDescription id={descId}>{description}</FieldDescription>}
      {!hideError && fieldState.error && <FieldError id={errorId} errors={[fieldState.error]} />}
    </Field>
  );
}
