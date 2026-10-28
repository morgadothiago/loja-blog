"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { login } from "@/actions/auth";
import { useAuthSubmit } from "@/components/auth/use-auth-submit";
import { ControlledInput } from "@/components/forms/controlled-input";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { useI18n } from "@/contexts/language-context";
import { createLoginSchema, type LoginFormValues } from "@/lib/schemas/auth";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const { t } = useI18n();
  const schema = useMemo(() => createLoginSchema(t), [t]);
  const methods = useForm<LoginFormValues>({ resolver: yupResolver(schema), defaultValues: { email: "", password: "" } });
  const { submit, formError } = useAuthSubmit(methods.setError);

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={methods.handleSubmit((v) => submit(() => login({ ...v, callbackUrl })))} className="grid gap-4">
        <ControlledInput<LoginFormValues>
          name="email" type="email" label={t("auth.email")} autoComplete="email" inputMode="email" inputClassName="h-11 text-base"
        />
        <ControlledInput<LoginFormValues>
          name="password" type="password" label={t("auth.password")} autoComplete="current-password" inputClassName="h-11 text-base"
          reveal={{ show: t("auth.password.show"), hide: t("auth.password.hide") }}
        />
        {formError && <FieldError>{formError}</FieldError>}
        <Button type="submit" className="h-11 text-base" disabled={methods.formState.isSubmitting}>
          {methods.formState.isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          {t("auth.noAccount")}{" "}
          <Link
            href={callbackUrl ? `/cadastro?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/cadastro"}
            className="inline-flex min-h-11 items-center underline underline-offset-4"
          >
            {t("auth.toRegister")}
          </Link>
        </p>
      </form>
    </FormProvider>
  );
}
