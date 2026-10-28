import { LayoutDashboardIcon, LogInIcon, UserIcon } from "lucide-react";
import type { AuthCtaIcon } from "@/lib/auth-cta";

// Ícone decorativo do botão de sessão; o texto do link é o nome acessível.
export function AuthCtaIconView({ name, className = "size-4" }: { name: AuthCtaIcon; className?: string }) {
  const Icon = { login: LogInIcon, dashboard: LayoutDashboardIcon, account: UserIcon }[name];
  return <Icon aria-hidden="true" className={className} />;
}
