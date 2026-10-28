import { notFound } from "next/navigation";
import { updateProduct } from "@/actions/products";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/dashboard/product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    db.category.findMany({ where: { kind: "PRODUCT" }, orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar produto</h1>
      <ProductForm action={updateProduct.bind(null, id)} categories={categories} product={product} />
    </div>
  );
}
