export function formatOrderSummary(cart) {
  if (!Array.isArray(cart) || cart.length === 0) return "Sin productos";

  return cart
    .map((item) => {
      const name = item.attributes?.name || item.name || "Producto";
      const qty = item.quantity || 1;
      return `${qty} ${name}`;
    })
    .join("\n");
}
