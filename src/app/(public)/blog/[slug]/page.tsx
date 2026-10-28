import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await db.post.findFirst({
    where: { slug, published: true },
    include: { category: true, author: true },
  });
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">{post.title}</h1>
      <p className="text-sm text-muted-foreground">
        {post.author.name} · {post.createdAt.toLocaleDateString("pt-BR")}
        {post.category && ` · ${post.category.name}`}
      </p>
      {post.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverUrl} alt={post.title} className="w-full rounded-lg" />
      )}
      <div className="whitespace-pre-wrap leading-7">{post.content}</div>
    </article>
  );
}
