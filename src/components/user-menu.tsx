"use client";

import { useTransition } from "react";
import Link from "next/link";
import { LayoutDashboardIcon, LogOutIcon, PackageIcon, UserIcon } from "lucide-react";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserMenuIcon, UserMenuItem } from "@/lib/auth-cta";
import { cn } from "@/lib/utils";

// Dados serializáveis (o servidor decide papel e itens; o texto já vem traduzido).
export type UserMenuData = {
  name?: string | null;
  email?: string | null;
  items: UserMenuItem[];
  labels: { trigger: string; logout: string };
};

const ICONS: Record<UserMenuIcon, typeof UserIcon> = {
  login: UserIcon,
  account: UserIcon,
  dashboard: LayoutDashboardIcon,
  orders: PackageIcon,
};

function useLogout() {
  const [pending, startTransition] = useTransition();
  // logout() termina em redirect("/") (com o toast "Você saiu"); o Next trata o redirect da Server Action.
  return { pending, run: () => startTransition(() => void logout()) };
}

function Identity({ name, email }: Pick<UserMenuData, "name" | "email">) {
  if (!name && !email) return null;
  return (
    <>
      {name && <span className="font-heading text-base text-foreground">{name}</span>}
      {email && <span className="text-xs break-all text-muted-foreground">{email}</span>}
    </>
  );
}

// Barra do header (xl+) e páginas internas: botão só com ícone (sem fundo nem borda) + dropdown.
export function UserMenu({ name, email, items, labels }: UserMenuData) {
  const { pending, run } = useLogout();
  const hasIdentity = Boolean(name || email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            aria-label={name ? `${labels.trigger}: ${name}` : labels.trigger}
            className="size-11 rounded-full"
          />
        }
      >
        <UserIcon aria-hidden="true" className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto max-w-[min(20rem,calc(100vw-2rem))] min-w-56 p-1.5">
        {hasIdentity && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col gap-0.5 px-3 py-2">
                <Identity name={name} email={email} />
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <DropdownMenuItem
              key={item.href}
              render={<Link href={item.href} />}
              className="min-h-11 gap-3 rounded-lg px-3 text-base"
            >
              <Icon aria-hidden="true" className="text-muted-foreground" />
              {item.label}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={pending}
          onClick={run}
          className="min-h-11 gap-3 rounded-lg px-3 text-base"
        >
          <LogOutIcon aria-hidden="true" />
          {labels.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Rodapé do painel mobile (Sheet): sem dropdown aninhado; lista com alvos >= 3rem.
export function UserPanel({
  name,
  email,
  items,
  labels,
  onNavigate,
  className,
}: UserMenuData & { onNavigate?: () => void; className?: string }) {
  const { pending, run } = useLogout();

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {(name || email) && (
        <p className="flex flex-col gap-0.5 px-3 pb-2">
          <Identity name={name} email={email} />
        </p>
      )}
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex min-h-12 items-center gap-3 rounded-lg px-3 text-base outline-none focus-visible:ring-2"
          >
            <Icon aria-hidden="true" className="size-5 text-muted-foreground" />
            {item.label}
          </Link>
        );
      })}
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={run}
        className="text-destructive mt-2 h-12 w-full gap-2 rounded-full text-base"
      >
        <LogOutIcon aria-hidden="true" />
        {labels.logout}
      </Button>
    </div>
  );
}
