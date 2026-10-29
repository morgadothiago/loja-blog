import Link from "next/link";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/dashboard", label: "Visão geral" },
  { href: "/dashboard/produtos", label: "Produtos" },
  { href: "/dashboard/posts", label: "Posts do blog" },
  { href: "/dashboard/categorias", label: "Categorias" },
  { href: "/dashboard/mensagens", label: "Mensagens" },
];

export function Sidebar({ userName }: { userName?: string | null }) {
  return (
    <aside className="flex w-56 shrink-0 flex-col gap-1 border-r p-4">
      <p className="mb-4 text-sm text-muted-foreground">Olá, {userName ?? "usuário"}</p>
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="rounded-md px-3 py-2 text-sm hover:bg-muted">
          {l.label}
        </Link>
      ))}
      <Link href="/" className="rounded-md px-3 py-2 text-sm hover:bg-muted">Ver site</Link>
      <form action={logout} className="mt-auto">
        <Button type="submit" variant="outline" size="sm" className="w-full">Sair</Button>
      </form>
    </aside>
  );
}
