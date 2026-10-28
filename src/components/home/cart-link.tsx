"use client";

import Link from "next/link";
import { ShoppingBagIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { cn } from "@/lib/utils";

// Único pedaço do header que precisa do cliente (contagem vem do localStorage).
// "icon": botão só com ícone e contador no canto (barra do header).
// "pill": pílula compacta (ícone + contador) com o mesmo visual do seletor de idioma, para ficar ao lado dele.
export function CartLink({ label, variant = "icon" }: { label: string; variant?: "icon" | "pill" }) {
  const { count } = useCart();
  const pill = variant === "pill";
  return (
    <Link
      href="/carrinho"
      aria-label={count > 0 ? `${label} (${count})` : label}
      className={
        pill
          ? // Mesmas classes do gatilho do LanguageSwitcher (pílula h-11); sem contador vira círculo (w-11).
            buttonVariants({
              variant: "outline",
              className: cn("bg-secondary border-ink/30 h-11 gap-2 rounded-full px-3 text-base", count === 0 && "w-11 px-0"),
            })
          : buttonVariants({ variant: "ghost", size: "icon", className: "relative size-11" })
      }
    >
      <ShoppingBagIcon className="size-5" aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className={
            pill
              ? "bg-primary text-primary-foreground min-w-5 rounded-full px-1.5 text-center text-xs"
              : "bg-primary text-primary-foreground absolute top-1 right-1 min-w-5 rounded-full px-1 text-center text-xs"
          }
        >
          {count}
        </span>
      )}
    </Link>
  );
}
