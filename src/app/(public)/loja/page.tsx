import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils-app";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const [categories, products] = await Promise.all([
    db.category.findMany({ where: { kind: "PRODUCT" }, orderBy: { name: "asc" } }),
    db.product.findMany({
      where: { published: true, ...(categoria && { category: { slug: categoria } }) },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Loja</h1>
      <div className="flex flex-wrap gap-2">
        <Link href="/loja"><Badge variant={!categoria ? "default" : "outline"}>Todos</Badge></Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/loja?categoria=${c.slug}`}>
            <Badge variant={categoria === c.slug ? "default" : "outline"}>{c.name}</Badge>
          </Link>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Link key={p.id} href={`/loja/${p.slug}`}>
            <Card>
              <CardHeader><CardTitle>{p.name}</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                <p className="font-medium">{formatPrice(p.priceCents)}</p>
                {p.category && <p className="text-xs text-muted-foreground">{p.category.name}</p>}
              </CardContent>
            </Card>
          </Link>
        ))}
        {products.length === 0 && <p className="text-muted-foreground">Nenhum produto encontrado.</p>}
      </div>
    </div>
  );
}
