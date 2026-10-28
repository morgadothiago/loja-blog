import { notFound } from "next/navigation";
import { updatePost } from "@/actions/posts";
import { db } from "@/lib/db";
import { PostForm } from "@/components/dashboard/post-form";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, categories] = await Promise.all([
    db.post.findUnique({ where: { id } }),
    db.category.findMany({ where: { kind: "POST" }, orderBy: { name: "asc" } }),
  ]);
  if (!post) notFound();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar post</h1>
      <PostForm action={updatePost.bind(null, id)} categories={categories} post={post} />
    </div>
  );
}
