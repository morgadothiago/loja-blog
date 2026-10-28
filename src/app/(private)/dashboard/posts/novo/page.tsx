import { createPost } from "@/actions/posts";
import { db } from "@/lib/db";
import { PostForm } from "@/components/dashboard/post-form";

export default async function NewPostPage() {
  const categories = await db.category.findMany({ where: { kind: "POST" }, orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Novo post</h1>
      <PostForm action={createPost} categories={categories} />
    </div>
  );
}
