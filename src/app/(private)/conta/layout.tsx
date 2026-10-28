import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";

// Segunda camada de proteção (a primeira é o proxy).
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <>
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-4 py-8 md:flex-row">
        <aside className="flex w-full shrink-0 flex-col gap-1 md:w-48">
          <Link href="/conta" className="rounded-md px-3 py-2 text-sm hover:bg-muted">Minha conta</Link>
          <Link href="/conta/pedidos" className="rounded-md px-3 py-2 text-sm hover:bg-muted">Meus pedidos</Link>
          <form action={logout} className="mt-4">
            <Button type="submit" variant="outline" size="sm" className="w-full">Sair</Button>
          </form>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </>
  );
}
