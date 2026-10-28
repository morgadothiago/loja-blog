import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Destino padrão pós-login: decide por papel com a sessão já criada (sem consulta prévia ao banco
// por e-mail, que diferenciaria usuários existentes de inexistentes).
export default async function AfterLoginPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  redirect(session.user.role === "ADMIN" ? "/dashboard" : "/conta");
}
