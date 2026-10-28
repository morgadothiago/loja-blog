import Link from "next/link";
import { deleteProduct } from "@/actions/products";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils-app";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function ProductsPage() {
  const products = await db.product.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Link href="/dashboard/produtos/novo" className={buttonVariants({  })}>Novo produto</Link>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead><TableHead>Categoria</TableHead><TableHead>Preço</TableHead>
            <TableHead>Estoque</TableHead><TableHead>Status</TableHead><TableHead className="w-40" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.category?.name ?? "—"}</TableCell>
              <TableCell>{formatPrice(p.priceCents)}</TableCell>
              <TableCell>{p.stock}</TableCell>
              <TableCell><Badge variant={p.published ? "default" : "secondary"}>{p.published ? "Publicado" : "Rascunho"}</Badge></TableCell>
              <TableCell className="flex gap-2">
                <Link href={`/dashboard/produtos/${p.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>Editar</Link>
                <DeleteButton action={deleteProduct.bind(null, p.id)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
