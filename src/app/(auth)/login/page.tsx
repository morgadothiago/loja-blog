import { AuthShell } from "@/components/auth/auth-shell";
import { getT } from "@/lib/i18n-server";
import { safeCallbackPath } from "@/lib/safe-path";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const [{ callbackUrl }, { t }] = await Promise.all([searchParams, getT()]);
  return (
    <AuthShell title={t("auth.login.title")}>
      <LoginForm callbackUrl={safeCallbackPath(callbackUrl) ?? undefined} />
    </AuthShell>
  );
}
