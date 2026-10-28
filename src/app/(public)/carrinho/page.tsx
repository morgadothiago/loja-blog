"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createOrder } from "@/actions/orders";
import { useServerAction } from "@/hooks/use-server-action";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/cart-context";
import { useI18n } from "@/contexts/language-context";
import { formatPrice } from "@/lib/utils-app";

export default function CartPage() {
  const { items, hydrated, totalCents, setQuantity, removeItem, clear } = useCart();
  const { t } = useI18n();
  const router = useRouter();
  const { run, pending } = useServerAction();

  function checkout() {
    run(() => createOrder(items.map((i) => ({ id: i.id, quantity: i.quantity }))), {
      onSuccess: ({ orderId }) => {
        clear();
        router.push(`/conta/pedidos/${orderId}`);
      },
    }).then((result) => {
      if (!result.ok && result.error.code === "UNAUTHENTICATED") router.push("/login?callbackUrl=%2Fcarrinho");
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("cart.title")}</h1>

      {hydrated && items.length === 0 && (
        <div className="space-y-4">
          <p className="text-muted-foreground">{t("cart.empty")}</p>
          <Link href="/loja" className={buttonVariants({ variant: "outline" })}>
            {t("cart.continue")}
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <>
          <ul className="divide-y rounded-lg border">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 p-4">
                <div className="flex-1">
                  <Link href={`/loja/${i.slug}`} className="font-medium">{i.name}</Link>
                  <p className="text-sm text-muted-foreground">{formatPrice(i.priceCents)}</p>
                </div>
                <Input
                  type="number"
                  min={1}
                  max={i.stock}
                  value={i.quantity}
                  onChange={(e) => setQuantity(i.id, Number(e.target.value) || 1)}
                  className="w-20"
                />
                <p className="w-28 text-right font-medium">{formatPrice(i.priceCents * i.quantity)}</p>
                <Button variant="ghost" size="sm" onClick={() => removeItem(i.id)}>{t("cart.remove")}</Button>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={clear}>{t("cart.clear")}</Button>
            <p className="text-xl font-bold">{t("cart.total")}: {formatPrice(totalCents)}</p>
          </div>
          <div className="flex justify-end">
            <Button size="lg" onClick={checkout} disabled={pending}>
              {pending ? t("cart.processing") : t("cart.checkout")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
