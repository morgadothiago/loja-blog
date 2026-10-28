import Link from "next/link";
import { deletePost } from "@/actions/posts";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function PostsPage() {
  const posts = await db.post.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Posts do blog</h1>
        <Link href="/dashboard/posts/novo" className={buttonVariants({  })}>Novo post</Link>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead><TableHead>Categoria</TableHead>
            <TableHead>Status</TableHead><TableHead className="w-40" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.title}</TableCell>
              <TableCell>{p.category?.name ?? "—"}</TableCell>
              <TableCell><Badge variant={p.published ? "default" : "secondary"}>{p.published ? "Publicado" : "Rascunho"}</Badge></TableCell>
              <TableCell className="flex gap-2">
                <Link href={`/dashboard/posts/${p.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>Editar</Link>
                <DeleteButton action={deletePost.bind(null, p.id)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
