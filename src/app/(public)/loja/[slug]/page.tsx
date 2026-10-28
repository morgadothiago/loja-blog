import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils-app";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await db.product.findFirst({
    where: { slug, published: true },
    include: { category: true },
  });
  if (!product) notFound();

  return (
    <article className="max-w-2xl space-y-4">
      {product.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.imageUrl} alt={product.name} className="w-full rounded-lg" />
      )}
      <h1 className="text-3xl font-bold">{product.name}</h1>
      <p className="text-2xl">{formatPrice(product.priceCents)}</p>
      {product.category && <p className="text-sm text-muted-foreground">{product.category.name}</p>}
      <p className="whitespace-pre-wrap">{product.description}</p>
      <p className="text-sm text-muted-foreground">{product.stock} un.</p>
      <AddToCartButton
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          priceCents: product.priceCents,
          imageUrl: product.imageUrl,
          stock: product.stock,
        }}
      />
    </article>
  );
}
