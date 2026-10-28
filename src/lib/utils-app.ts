export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const ORDER_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Aguardando pagamento", variant: "secondary" },
  PAID: { label: "Pago", variant: "default" },
  SHIPPED: { label: "Enviado", variant: "default" },
  DELIVERED: { label: "Entregue", variant: "outline" },
  CANCELED: { label: "Cancelado", variant: "destructive" },
};
