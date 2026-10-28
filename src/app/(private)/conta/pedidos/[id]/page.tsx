import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ORDER_STATUS, formatPrice } from "@/lib/utils-app";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  // filtra por userId: um cliente nunca enxerga pedido de outro
  const order = await db.order.findFirst({
    where: { id, userId: session!.user.id },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <Link href="/conta/pedidos" className="text-sm underline">← Meus pedidos</Link>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Pedido #{order.id.slice(-8).toUpperCase()}</h1>
        <Badge variant={ORDER_STATUS[order.status]?.variant}>{ORDER_STATUS[order.status]?.label ?? order.status}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">Realizado em {order.createdAt.toLocaleString("pt-BR")}</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead><TableHead>Qtd.</TableHead>
            <TableHead>Preço</TableHead><TableHead className="text-right">Subtotal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.items.map((i) => (
            <TableRow key={i.id}>
              <TableCell>{i.name}</TableCell>
              <TableCell>{i.quantity}</TableCell>
              <TableCell>{formatPrice(i.priceCents)}</TableCell>
              <TableCell className="text-right">{formatPrice(i.priceCents * i.quantity)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-right text-xl font-bold">Total: {formatPrice(order.totalCents)}</p>
    </div>
  );
}
