import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Package, ShoppingCart, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { removeFromCart, updateCartQuantity } from "./actions";

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export default async function CarrinhoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "consumidor" && profile.role !== "produtor")) redirect("/inicio");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!subscription || subscription.status !== "active") redirect("/loja");

  const { data: cartRaw } = await supabase
    .from("cart_items")
    .select("quantity, product_id, products(id, name, price_cents, points_value, image_url, status, approved)")
    .eq("user_id", user.id)
    .order("created_at");

  const items = (cartRaw ?? []).filter(
    (item) => item.products && item.products.status === "active" && item.products.approved,
  );

  const subtotalCents = items.reduce((sum, item) => sum + item.products!.price_cents * item.quantity, 0);
  const totalPoints = items.reduce((sum, item) => sum + item.products!.points_value * item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="marketplace-shell marketplace-cart mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
        <Link href="/loja" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para a loja
        </Link>
        <header>
          <h1 className="font-heading text-2xl font-semibold text-cc-green">Carrinho</h1>
        </header>
        <Card className="marketplace-notice">
          <CardContent className="flex flex-col items-center py-14 text-center">
            <ShoppingCart className="mb-4 h-12 w-12 text-muted-foreground/25" />
            <p className="font-heading text-lg font-semibold text-cc-green">Seu carrinho está vazio</p>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">Explore a loja e adicione produtos sustentáveis</p>
            <Button asChild>
              <Link href="/loja">Explorar loja</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="marketplace-shell marketplace-cart mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Link href="/loja" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        Voltar para a loja
      </Link>

      <header>
        <h1 className="font-heading text-2xl font-semibold text-cc-green">Carrinho</h1>
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "itens"}
        </p>
      </header>

      {/* Items */}
      <div className="cart-items-list space-y-3">
        {items.map((item) => {
          const product = item.products!;
          const lineTotal = product.price_cents * item.quantity;
          return (
            <Card key={item.product_id} className="marketplace-cart-item">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-cc-cream/50">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-6 w-6 text-cc-sand" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-cc-green">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(product.price_cents)} / un.
                  </p>
                  <p className="mt-0.5 font-semibold text-cc-green">{formatPrice(lineTotal)}</p>
                  {product.points_value > 0 ? (
                    <p className="flex items-center gap-1 text-xs text-cc-orange">
                      <Sparkles className="h-3 w-3" />+{product.points_value * item.quantity} pts
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {/* Quantity stepper */}
                  <form action={updateCartQuantity}>
                    <input type="hidden" name="product_id" value={product.id} />
                    <div className="flex items-center gap-1">
                      <button
                        type="submit"
                        name="quantity"
                        value={Math.max(1, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-base transition-colors hover:bg-muted disabled:opacity-40"
                        aria-label="Diminuir"
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        type="submit"
                        name="quantity"
                        value={Math.min(99, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-base transition-colors hover:bg-muted"
                        aria-label="Aumentar"
                      >
                        +
                      </button>
                    </div>
                  </form>

                  <form action={removeFromCart} className="ml-2">
                    <input type="hidden" name="product_id" value={product.id} />
                    <button
                      type="submit"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-destructive"
                      aria-label="Remover item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="marketplace-summary cart-summary-card">
        <CardContent className="space-y-2 py-4 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Frete</span>
            <span className="text-cc-orange">A confirmar</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base font-semibold text-cc-green">
            <span>Total estimado</span>
            <span>{formatPrice(subtotalCents)}</span>
          </div>
          {totalPoints > 0 ? (
            <p className="flex items-center gap-1 pt-1 text-xs text-cc-orange">
              <Sparkles className="h-3.5 w-3.5" />
              Você vai ganhar +{totalPoints} pontos nesta compra
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Button asChild size="lg" className="w-full">
        <Link href="/loja/checkout">
          Ir para o checkout
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>

      <Link href="/loja" className="text-center text-sm text-muted-foreground hover:text-cc-green">
        Continuar comprando
      </Link>
    </div>
  );
}
