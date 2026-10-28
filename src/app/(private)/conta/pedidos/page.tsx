import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ORDER_STATUS, formatPrice } from "@/lib/utils-app";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function OrdersPage() {
  const session = await auth();
  const orders = await db.order.findMany({
    where: { userId: session!.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meus pedidos</h1>
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">Você ainda não fez nenhuma compra.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead><TableHead>Data</TableHead><TableHead>Itens</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell><Link href={`/conta/pedidos/${o.id}`} className="underline">#{o.id.slice(-8).toUpperCase()}</Link></TableCell>
                <TableCell>{o.createdAt.toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>{o.items.reduce((n, i) => n + i.quantity, 0)}</TableCell>
                <TableCell><Badge variant={ORDER_STATUS[o.status]?.variant}>{ORDER_STATUS[o.status]?.label ?? o.status}</Badge></TableCell>
                <TableCell className="text-right">{formatPrice(o.totalCents)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
