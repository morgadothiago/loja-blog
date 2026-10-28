"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { register } from "@/actions/auth";
import { useAuthSubmit } from "@/components/auth/use-auth-submit";
import { ControlledInput } from "@/components/forms/controlled-input";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { useI18n } from "@/contexts/language-context";
import { createRegisterSchema, type RegisterFormValues } from "@/lib/schemas/auth";

export function RegisterForm({ callbackUrl }: { callbackUrl?: string }) {
  const { t } = useI18n();
  const schema = useMemo(() => createRegisterSchema(t), [t]);
  const methods = useForm<RegisterFormValues>({ resolver: yupResolver(schema), defaultValues: { name: "", email: "", password: "" } });
  const { submit, formError } = useAuthSubmit(methods.setError);

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={methods.handleSubmit((v) => submit(() => register({ ...v, callbackUrl })))} className="grid gap-4">
        <ControlledInput<RegisterFormValues> name="name" label={t("auth.name")} autoComplete="name" inputClassName="h-11 text-base" />
        <ControlledInput<RegisterFormValues>
          name="email" type="email" label={t("auth.email")} autoComplete="email" inputMode="email" inputClassName="h-11 text-base"
        />
        <ControlledInput<RegisterFormValues>
          name="password" type="password" label={t("auth.password")} autoComplete="new-password" inputClassName="h-11 text-base"
          description={t("auth.password.hint")} reveal={{ show: t("auth.password.show"), hide: t("auth.password.hide") }}
        />
        {formError && <FieldError>{formError}</FieldError>}
        <Button type="submit" className="h-11 text-base" disabled={methods.formState.isSubmitting}>
          {methods.formState.isSubmitting ? t("auth.register.submitting") : t("auth.register.submit")}
        </Button>
        <p className="text-muted-foreground text-center text-sm">
          {t("auth.hasAccount")}{" "}
          <Link
            href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
            className="inline-flex min-h-11 items-center underline underline-offset-4"
          >
            {t("auth.toLogin")}
          </Link>
        </p>
      </form>
    </FormProvider>
  );
}
