import { createProduct } from "@/actions/products";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/dashboard/product-form";

export default async function NewProductPage() {
  const categories = await db.category.findMany({ where: { kind: "PRODUCT" }, orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Novo produto</h1>
      <ProductForm action={createProduct} categories={categories} />
    </div>
  );
}
