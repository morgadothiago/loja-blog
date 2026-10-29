import Link from "next/link";
import { redirect } from "next/navigation";
import { markContactRead } from "@/actions/contact-admin";
import { auth } from "@/auth";
import { MarkReadButton } from "@/components/dashboard/mark-read-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";

const PAGE_SIZE = 20;

// Mensagens do formulário de contato (spec 0012). O layout já exige ADMIN; a leitura confere de novo
// (defesa em camadas). Texto exibido como texto: o React escapa, sem dangerouslySetInnerHTML.
export default async function MessagesPage({ searchParams }: PageProps<"/dashboard/mensagens">) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/login");

  const raw = Number((await searchParams).page);
  const requested = Number.isInteger(raw) && raw > 0 ? raw : 1;
  const total = await db.contactMessage.count();
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requested, pages);
  const messages = await db.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mensagens de contato</h1>
      {messages.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma mensagem ainda.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quando</TableHead>
              <TableHead>Quem</TableHead>
              <TableHead>Mensagem</TableHead>
              <TableHead className="w-40" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="align-top whitespace-nowrap">
                  {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(m.createdAt)}
                </TableCell>
                <TableCell className="align-top">
                  <p className="font-medium break-words">{m.name}</p>
                  <p className="text-muted-foreground text-sm break-all">{m.email}</p>
                  <Badge variant="secondary" className="mt-1">{m.locale}</Badge>
                </TableCell>
                <TableCell className="max-w-prose align-top whitespace-pre-wrap break-words">{m.message}</TableCell>
                <TableCell className="align-top">
                  {m.readAt ? (
                    <Badge variant="secondary">Lida</Badge>
                  ) : (
                    <MarkReadButton action={markContactRead.bind(null, m.id)} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {pages > 1 && (
        <nav aria-label="Paginação" className="flex items-center gap-3">
          {page > 1 && (
            <Link href={`/dashboard/mensagens?page=${page - 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Anterior
            </Link>
          )}
          <span className="text-muted-foreground text-sm">
            Página {page} de {pages}
          </span>
          {page < pages && (
            <Link href={`/dashboard/mensagens?page=${page + 1}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Próxima
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
