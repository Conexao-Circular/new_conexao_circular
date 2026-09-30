import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, CreditCard, Leaf, Package, QrCode, Receipt, ShoppingCart, Sparkles, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { addToCart } from "../carrinho/actions";

export default async function ProdutoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ adicionado?: string }>;
}) {
  const { id } = await params;
  const { adicionado } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "consumidor" && profile.role !== "produtor")) {
    redirect("/inicio");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!subscription) {
    redirect("/onboarding/plano");
  }

  if (subscription.status !== "active") {
    redirect("/loja");
  }

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, name, description, price_cents, points_value, category, image_url, status, approved, partner_id, stock, sustainability_note",
    )
    .eq("id", id)
    .maybeSingle();

  if (!product || product.status !== "active" || !product.approved) {
    notFound();
  }

  await supabase.rpc("increment_product_view", { p_product_id: product.id });

  const { data: gallery } = await supabase
    .from("product_images")
    .select("url")
    .eq("product_id", product.id)
    .order("sort_order", { ascending: true });

  const images = gallery?.length ? gallery.map((g) => g.url) : product.image_url ? [product.image_url] : [];

  const [{ data: sellers }, { data: relatedProducts }] = await Promise.all([
    supabase.rpc("get_producer_store", { p_id: product.partner_id }),
    supabase
      .from("products")
      .select("id, name, price_cents, image_url")
      .eq("partner_id", product.partner_id)
      .eq("status", "active")
      .eq("approved", true)
      .neq("id", product.id)
      .order("name")
      .limit(3),
  ]);
  const seller = sellers?.[0];

  async function handleAddToCart(formData: FormData) {
    "use server";
    await addToCart(formData);
    redirect(`/loja/${id}?adicionado=1`);
  }

  return (
    <div className="marketplace-shell marketplace-detail mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <Link href="/loja" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para a loja
        </Link>
        <Link href="/loja/carrinho" className="relative inline-flex items-center gap-1 text-sm font-medium text-cc-green">
          <ShoppingCart className="h-5 w-5" />
          Carrinho
        </Link>
      </div>

      {adicionado === "1" ? (
        <div className="flex items-start gap-3 rounded-xl border border-cc-green/30 bg-cc-green/8 px-4 py-3 text-sm text-cc-green">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Adicionado ao carrinho!</p>
            <Link href="/loja/carrinho" className="text-cc-green/80 underline underline-offset-2">
              Ver carrinho e finalizar compra
            </Link>
          </div>
        </div>
      ) : null}

      <Card className="marketplace-product-card">
        <div className="marketplace-product-visual">
        {images.length > 0 ? (
          <div className="marketplace-product-gallery flex w-full snap-x snap-mandatory overflow-x-auto rounded-t-xl bg-cc-cream/50">
            {images.map((src, index) => (
              <div key={src} className="relative h-72 w-full shrink-0 snap-center sm:h-96">
                <Image
                  src={src}
                  alt={`${product.name} — foto ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 640px"
                  className="object-cover"
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="marketplace-product-gallery flex h-60 w-full items-center justify-center overflow-hidden rounded-t-xl bg-cc-cream/50">
            <Package className="h-14 w-14 text-cc-sand" />
          </div>
        )}
        </div>
        <div className="marketplace-product-info">
        {product.stock <= 0 ? (
          <p className="bg-[var(--critico,#ef4444)]/10 px-4 py-1.5 text-center text-xs font-medium text-[var(--critico,#ef4444)]">
            Esgotado
          </p>
        ) : product.stock <= 5 ? (
          <p className="bg-[var(--alto,#f97316)]/10 px-4 py-1.5 text-center text-xs font-medium text-[var(--alto,#f97316)]">
            Últimas {product.stock} unidades
          </p>
        ) : null}
        <CardHeader>
          <CardTitle>{product.name}</CardTitle>
          {seller ? (
            <Link
              href={`/loja/produtores/${product.partner_id}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-cc-orange"
            >
              <Store className="h-3.5 w-3.5" />
              Vendido por {seller.store_name ?? seller.name}
            </Link>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {product.description ? <p className="text-muted-foreground">{product.description}</p> : null}

          {product.sustainability_note ? (
            <div className="flex gap-2 rounded-xl border border-cc-green/20 bg-cc-green/5 p-3">
              <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-cc-green" />
              <div>
                <p className="text-xs font-semibold text-cc-green">Por que esse produto é sustentável</p>
                <p className="text-foreground/80">{product.sustainability_note}</p>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold text-cc-green">{formatPrice(product.price_cents)}</span>
            {product.points_value > 0 ? (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-cc-orange">
                <Sparkles className="h-4 w-4" />+{product.points_value} pts por unidade
              </span>
            ) : null}
          </div>

          <form action={handleAddToCart} className="space-y-4 pt-2">
            <input type="hidden" name="product_id" value={product.id} />
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input id="quantity" name="quantity" type="number" min="1" max="99" defaultValue={1} required />
            </div>
            <Button type="submit" className="w-full">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Adicionar ao carrinho
            </Button>
          </form>

          {adicionado === "1" ? (
            <Button asChild variant="outline" className="w-full">
              <Link href="/loja/checkout">Finalizar compra</Link>
            </Button>
          ) : null}

          <div className="product-payment-panel">
            <p className="product-panel-title">Formas de pagamento disponíveis</p>
            <div className="product-payment-options">
              <span><QrCode /> PIX</span>
              <span><CreditCard /> Cartão</span>
              <span><Receipt /> Boleto</span>
            </div>
            <p className="product-payment-note">As condições finais e descontos são confirmados no checkout.</p>
          </div>

          <div className="product-value-panel">
            <p className="product-panel-title">Por que este produto importa</p>
            <p>Além de levar uma escolha circular para sua rotina, sua compra gera pontos quando confirmada no sistema.</p>
          </div>

          {relatedProducts && relatedProducts.length > 0 ? (
            <div className="product-related-panel">
              <div className="flex items-center justify-between gap-3">
                <p className="product-panel-title">Você também pode gostar</p>
                <Link href="/loja" className="text-xs font-bold text-cc-orange">Ver mais</Link>
              </div>
              <div className="product-related-list">
                {relatedProducts.map((related) => (
                  <Link key={related.id} href={`/loja/${related.id}`} className="product-related-item">
                    <span className="product-related-image">
                      {related.image_url ? <Image src={related.image_url} alt="" fill sizes="48px" className="object-cover" /> : <Package className="h-4 w-4 text-cc-sand" />}
                    </span>
                    <span><strong>{related.name}</strong><small>{formatPrice(related.price_cents)}</small></span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

        </CardContent>
        </div>
      </Card>
    </div>
  );
}
