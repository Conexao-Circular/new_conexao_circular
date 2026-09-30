export type ListingStatus = "active" | "inactive";

export function listingStatus(product: { status: ListingStatus; approved: boolean }) {
  if (product.approved && product.status === "active") {
    return { label: "Publicado", variant: "default" as const };
  }
  if (product.approved && product.status === "inactive") {
    return { label: "Pausado", variant: "secondary" as const };
  }
  if (!product.approved && product.status === "active") {
    return { label: "Em análise", variant: "secondary" as const };
  }
  return { label: "Recusado", variant: "destructive" as const };
}
