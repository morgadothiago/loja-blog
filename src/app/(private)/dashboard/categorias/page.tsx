import { deleteCategory } from "@/actions/categories";
import { CategoryForm } from "@/components/dashboard/category-form";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function CategoriesPage() {
  const categories = await db.category.findMany({ orderBy: [{ kind: "asc" }, { name: "asc" }] });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Categorias</h1>
      <CategoryForm />
      <Table>
        <TableHeader>
          <TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead className="w-24" /></TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.name}</TableCell>
              <TableCell><Badge variant="secondary">{c.kind === "PRODUCT" ? "Produto" : "Blog"}</Badge></TableCell>
              <TableCell><DeleteButton action={deleteCategory.bind(null, c.id)} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
