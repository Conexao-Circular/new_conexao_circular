import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { computeLevel } from "@/lib/gamification";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!subscription || subscription.status !== "active") redirect("/loja");

  const { data: buyerProfile } = await supabase
    .from("profiles")
    .select("cashback_cents, document, lifetime_points")
    .eq("id", user.id)
    .single();

  const level = computeLevel(buyerProfile?.lifetime_points ?? 0);

  const { data: cartRaw } = await supabase
    .from("cart_items")
    .select("quantity, product_id, products(id, name, price_cents, points_value, image_url, status, approved)")
    .eq("user_id", user.id)
    .order("created_at");

  const items = (cartRaw ?? []).filter(
    (item) => item.products && item.products.status === "active" && item.products.approved,
  );

  if (items.length === 0) redirect("/loja/carrinho");

  const { error } = await searchParams;

  const normalized = items.map((item) => ({
    product_id: item.product_id,
    quantity: item.quantity,
    products: item.products!,
  }));

  return (
    <div className="marketplace-shell marketplace-checkout mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Link href="/loja/carrinho" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        Voltar ao carrinho
      </Link>

      <header>
        <h1 className="font-heading text-2xl font-semibold text-cc-green">Checkout</h1>
        <p className="text-sm text-muted-foreground">Revise e confirme seu pedido</p>
      </header>

      <CheckoutForm
        items={normalized}
        error={error}
        cashbackCents={buyerProfile?.cashback_cents ?? 0}
        defaultCpf={buyerProfile?.document ?? ""}
        levelName={level.current.name}
        lifetimePoints={buyerProfile?.lifetime_points ?? 0}
      />
    </div>
  );
}
