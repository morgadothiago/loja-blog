import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getT } from "@/lib/i18n-server";
import { SITE } from "@/lib/site";

export async function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = await getT();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-5 py-10">
      <Link href="/" className="font-heading flex min-h-11 items-center text-2xl tracking-wide">
        {SITE.name}
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      <Link href="/" className="text-muted-foreground flex min-h-11 items-center text-sm underline underline-offset-4">
        {t("auth.backHome")}
      </Link>
    </main>
  );
}
