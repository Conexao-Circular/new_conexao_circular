import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Leaf, MapPin, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

const PARTNER_CATEGORY_LABELS: Record<string, string> = {
  restaurante: "Restaurante",
  hotel: "Hotel",
  produtor_local: "Produtor local",
  shopping: "Shopping",
  servico: "Serviço",
  outro: "Parceiro",
};

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export default async function ParceiroPage({
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

  const { data: partner } = await supabase
    .from("partners")
    .select(
      "id, name, category, description, address, seal, image_url, status, partner_items(id, name, description, price_cents, icon, sort_order)"
    )
    .eq("id", id)
    .order("sort_order", { referencedTable: "partner_items" })
    .maybeSingle();

  if (!partner || partner.status !== "active") {
    notFound();
  }

  return (
    <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <Link href="/loja?aba=parceiros" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para parceiros
        </Link>
      </div>

      <Card>
        <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-t-xl bg-cc-cream/50">
          {partner.image_url ? (
            <Image src={partner.image_url} alt={partner.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
          ) : (
            <Store className="h-12 w-12 text-cc-sand" />
          )}
        </div>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="font-heading text-xl text-cc-green">{partner.name}</CardTitle>
            {partner.seal ? (
              <Badge variant="secondary" className="gap-1 whitespace-nowrap">
                <Leaf className="h-3 w-3" />
                Selo Conexão Circular
              </Badge>
            ) : null}
          </div>
          <Badge variant="outline" className="w-fit">
            {PARTNER_CATEGORY_LABELS[partner.category] ?? partner.category}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cc-orange" />
            <span>{partner.address}</span>
          </div>

          {partner.description ? <p className="text-muted-foreground">{partner.description}</p> : null}
        </CardContent>
      </Card>

      {(partner.partner_items ?? []).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produtos e serviços</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(partner.partner_items ?? []).map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-start gap-2">
                  {item.icon ? <span className="text-lg leading-none">{item.icon}</span> : null}
                  <div>
                    <p className="font-medium text-cc-green">{item.name}</p>
                    {item.description ? (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    ) : null}
                  </div>
                </div>
                <span className="whitespace-nowrap font-medium text-cc-green">{formatPrice(item.price_cents)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <p className="text-center text-xs text-muted-foreground">
        Itens exibidos a título informativo. Para reservas ou compras, entre em contato diretamente com o parceiro.
      </p>
    </div>
  );
}
