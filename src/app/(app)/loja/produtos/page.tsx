import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, CheckCircle2, Package, Plus, Sparkles, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormError } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/server";
import { toggleProductStatus } from "./actions";
import { DeleteProductButton } from "./delete-product-button";
import { listingStatus } from "./status";

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export default async function MeusAnunciosPage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string; excluido?: string; error?: string }>;
}) {
  const { enviado, excluido, error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (!profile || profile.role !== "produtor") {
    redirect("/inicio");
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_cents, points_value, image_url, status, approved, stock")
    .eq("partner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-cc-green">Meus anúncios</h1>
          <p className="text-sm text-muted-foreground">Gerencie os produtos que você anuncia no Marketplace.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/loja/envios">
              <Truck className="h-4 w-4" />
              Pedidos a enviar
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/loja/dashboard">
              <BarChart3 className="h-4 w-4" />
              Ver métricas
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/loja/produtos/novo">
              <Plus className="h-4 w-4" />
              Novo
            </Link>
          </Button>
        </div>
      </header>

      <FormError message={error} />

      {enviado === "1" ? (
        <div className="flex items-start gap-3 rounded-xl border border-cc-green/30 bg-cc-green/8 px-4 py-3 text-sm text-cc-green">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Anúncio enviado para análise!</p>
            <p className="text-cc-green/80">Em breve nossa equipe vai revisar e publicar no Marketplace.</p>
          </div>
        </div>
      ) : null}

      {excluido === "1" ? (
        <div className="flex items-start gap-3 rounded-xl border border-cc-green/30 bg-cc-green/8 px-4 py-3 text-sm text-cc-green">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="font-medium">Anúncio excluído.</p>
        </div>
      ) : null}

      {products && products.length > 0 ? (
        <div className="space-y-3">
          {products.map((product) => {
            const status = listingStatus(product);
            const toggleLabel =
              product.status === "active" ? "Pausar" : product.approved ? "Reativar" : "Reenviar p/ análise";

            return (
              <Card key={product.id}>
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cc-cream/50">
                      {product.image_url ? (
                        <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
                      ) : (
                        <Package className="h-6 w-6 text-cc-sand" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-cc-green">{product.name}</p>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-medium text-cc-green">{formatPrice(product.price_cents)}</span>
                        {product.points_value > 0 ? (
                          <span className="inline-flex items-center gap-1 text-cc-orange">
                            <Sparkles className="h-3.5 w-3.5" />+{product.points_value} pts
                          </span>
                        ) : null}
                      </div>
                      {product.stock <= 0 ? (
                        <Badge variant="destructive">Sem estoque</Badge>
                      ) : product.stock <= 5 ? (
                        <Badge variant="secondary">Estoque baixo: {product.stock}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Estoque: {product.stock}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 sm:ml-auto">
                    <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none">
                      <Link href={`/loja/produtos/${product.id}/editar`}>Editar</Link>
                    </Button>
                    <form action={toggleProductStatus} className="flex-1 sm:flex-none">
                      <input type="hidden" name="id" value={product.id} />
                      <Button type="submit" variant="outline" size="sm" className="w-full">
                        {toggleLabel}
                      </Button>
                    </form>
                    <DeleteProductButton productId={product.id} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            <Package className="mx-auto mb-2 h-6 w-6 text-cc-sand" />
            Você ainda não tem anúncios. Toque em &quot;Novo&quot; para criar o primeiro.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
