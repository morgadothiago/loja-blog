import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const [categories, posts] = await Promise.all([
    db.category.findMany({ where: { kind: "POST" }, orderBy: { name: "asc" } }),
    db.post.findMany({
      where: { published: true, ...(categoria && { category: { slug: categoria } }) },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Blog</h1>
      <div className="flex flex-wrap gap-2">
        <Link href="/blog"><Badge variant={!categoria ? "default" : "outline"}>Todos</Badge></Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/blog?categoria=${c.slug}`}>
            <Badge variant={categoria === c.slug ? "default" : "outline"}>{c.name}</Badge>
          </Link>
        ))}
      </div>
      <div className="grid gap-4">
        {posts.map((p) => (
          <Link key={p.id} href={`/blog/${p.slug}`}>
            <Card>
              <CardHeader>
                <CardTitle>{p.title}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {p.createdAt.toLocaleDateString("pt-BR")}{p.category && ` · ${p.category.name}`}
                </p>
              </CardHeader>
              {p.excerpt && <CardContent className="text-sm text-muted-foreground">{p.excerpt}</CardContent>}
            </Card>
          </Link>
        ))}
        {posts.length === 0 && <p className="text-muted-foreground">Nenhum post encontrado.</p>}
      </div>
    </div>
  );
}
