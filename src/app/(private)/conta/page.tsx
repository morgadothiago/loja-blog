import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ORDER_STATUS, formatPrice } from "@/lib/utils-app";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AccountPage() {
  const session = await auth();
  const userId = session!.user.id;
  const [user, orders] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.order.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Olá, {user?.name ?? "cliente"}</h1>

      <Card>
        <CardHeader><CardTitle>Meus dados</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p><span className="text-muted-foreground">Nome:</span> {user?.name}</p>
          <p><span className="text-muted-foreground">Email:</span> {user?.email}</p>
          <p><span className="text-muted-foreground">Cliente desde:</span> {user?.createdAt.toLocaleDateString("pt-BR")}</p>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pedidos recentes</h2>
          <Link href="/conta/pedidos" className="text-sm underline">Ver todos</Link>
        </div>
        {orders.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Você ainda não fez nenhuma compra.</p>
            <Link href="/loja" className={buttonVariants()}>Ir para a loja</Link>
          </div>
        )}
        {orders.map((o) => (
          <Link key={o.id} href={`/conta/pedidos/${o.id}`} className="flex items-center justify-between rounded-lg border p-4 text-sm">
            <span>#{o.id.slice(-8).toUpperCase()} · {o.createdAt.toLocaleDateString("pt-BR")}</span>
            <span className="flex items-center gap-3">
              <Badge variant={ORDER_STATUS[o.status]?.variant}>{ORDER_STATUS[o.status]?.label ?? o.status}</Badge>
              <strong>{formatPrice(o.totalCents)}</strong>
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
