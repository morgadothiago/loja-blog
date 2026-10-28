import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Segunda camada (a primeira é o proxy): carrinho exige login.
export default async function CartLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=%2Fcarrinho");
  return children;
}
