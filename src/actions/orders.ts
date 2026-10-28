"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { defineAction } from "@/lib/action";
import { BusinessError } from "@/lib/errors";

const itemsSchema = z
  .array(z.object({ id: z.string(), quantity: z.number().int().min(1).max(99) }))
  .min(1);

// Preço e estoque vêm SEMPRE do banco; o carrinho do cliente só informa id e quantidade.
export const createOrder = defineAction({ name: "createOrder", auth: "user", schema: itemsSchema }, async (items, { user }) => {
  const order = await db.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: items.map((i) => i.id) }, published: true },
    });

    let totalCents = 0;
    const lines = items.map((i) => {
      const p = products.find((x) => x.id === i.id);
      if (!p) throw new BusinessError("CONFLICT", "PRODUCT_UNAVAILABLE");
      if (p.stock < i.quantity) throw new BusinessError("CONFLICT", "OUT_OF_STOCK");
      totalCents += p.priceCents * i.quantity;
      return { productId: p.id, name: p.name, priceCents: p.priceCents, quantity: i.quantity };
    });

    // decremento condicional: evita estoque negativo em compras simultâneas
    for (const l of lines) {
      const { count } = await tx.product.updateMany({
        where: { id: l.productId, stock: { gte: l.quantity } },
        data: { stock: { decrement: l.quantity } },
      });
      if (count === 0) throw new BusinessError("CONFLICT", "OUT_OF_STOCK");
    }

    return tx.order.create({
      data: { userId: user!.id, totalCents, items: { create: lines } },
    });
  });

  revalidatePath("/conta/pedidos");
  revalidatePath("/loja");
  return { orderId: order.id };
});
