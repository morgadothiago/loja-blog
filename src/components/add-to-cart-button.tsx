"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart, type CartItem } from "@/contexts/cart-context";
import { useI18n } from "@/contexts/language-context";

export function AddToCartButton({ product }: { product: Omit<CartItem, "quantity"> }) {
  const { addItem } = useCart();
  const { t } = useI18n();

  if (product.stock <= 0) {
    return <Button disabled>{t("shop.outOfStock")}</Button>;
  }
  return (
    <Button
      onClick={() => {
        addItem(product);
        toast.success(t("cart.added"));
      }}
    >
      {t("cart.add")}
    </Button>
  );
}
