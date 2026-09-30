import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BadgeCheck, Package, Sparkles, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export default async function ProdutorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

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

  const { data: producers } = await supabase.rpc("get_producer_store", { p_id: id });
  const producer = producers?.[0];

  if (!producer) {
    notFound();
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, price_cents, points_value, image_url")
    .eq("partner_id", id)
    .eq("status", "active")
    .eq("approved", true)
    .order("name");

  const { data: application } = await supabase
    .from("producer_applications")
    .select("status, sustainability_description, material_origin, operation_description")
    .eq("profile_id", id)
    .eq("status", "approved")
    .maybeSingle();

  return (
    <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <Link href="/loja?aba=produtores" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para produtores
        </Link>
      </div>

      <Card>
        <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-t-xl bg-cc-cream/50">
          {producer.store_image_url ? (
            <Image
              src={producer.store_image_url}
              alt={producer.store_name ?? producer.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          ) : (
            <Store className="h-12 w-12 text-cc-sand" />
          )}
        </div>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 font-heading text-xl text-cc-green">
            {producer.store_name ?? producer.name}
            {application ? (
              <Badge className="gap-1 bg-cc-green/10 text-cc-green hover:bg-cc-green/10">
                <BadgeCheck className="h-3.5 w-3.5" />
                Parceiro Verificado
              </Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        {producer.store_description ? (
          <CardContent className="text-sm text-foreground/80">{producer.store_description}</CardContent>
        ) : null}
      </Card>

      {application ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sobre este parceiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-cc-green">O que produzimos/coletamos</p>
              <p className="text-foreground/80">{application.sustainability_description}</p>
            </div>
            <div>
              <p className="font-medium text-cc-green">De onde vêm os materiais</p>
              <p className="text-foreground/80">{application.material_origin}</p>
            </div>
            <div>
              <p className="font-medium text-cc-green">Como funciona a operação</p>
              <p className="text-foreground/80">{application.operation_description}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {products && products.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((product) => (
            <Link key={product.id} href={`/loja/${product.id}`}>
              <Card className="h-full transition-colors hover:border-cc-orange">
                <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-t-xl bg-cc-cream/50">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
                  ) : (
                    <Package className="h-10 w-10 text-cc-sand" />
                  )}
                </div>
                <CardHeader>
                  <CardTitle>{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {product.description ? (
                    <p className="line-clamp-2 text-foreground/80">{product.description}</p>
                  ) : null}
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-semibold text-cc-green">{formatPrice(product.price_cents)}</span>
                    {product.points_value > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-cc-orange">
                        <Sparkles className="h-3.5 w-3.5" />+{product.points_value} pts
                      </span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            <Package className="mx-auto mb-2 h-6 w-6 text-cc-sand" />
            Esta loja ainda não tem produtos publicados.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
