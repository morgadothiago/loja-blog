import { AuthShell } from "@/components/auth/auth-shell";
import { getT } from "@/lib/i18n-server";
import { safeCallbackPath } from "@/lib/safe-path";
import { RegisterForm } from "./register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const [{ callbackUrl }, { t }] = await Promise.all([searchParams, getT()]);
  return (
    <AuthShell title={t("auth.register.title")}>
      <RegisterForm callbackUrl={safeCallbackPath(callbackUrl) ?? undefined} />
    </AuthShell>
  );
}
