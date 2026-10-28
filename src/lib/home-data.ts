import { db } from "@/lib/db";

// Só posts publicados; rascunhos nunca chegam à home.
export async function getRecentStories(take = 3) {
  const posts = await db.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, slug: true, title: true, coverUrl: true, createdAt: true, category: { select: { name: true } } },
  });
  return posts.map(({ category, ...p }) => ({ ...p, categoryName: category?.name ?? null }));
}
