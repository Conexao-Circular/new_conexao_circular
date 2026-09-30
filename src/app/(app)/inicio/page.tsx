import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Leaf, MapPin, Package, Recycle, Sparkles, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CO2_ESTIMATE_LABEL, estimatedCo2AvoidedKg } from "@/lib/impact";
import { createClient } from "@/lib/supabase/server";
import { listingStatus } from "../loja/produtos/status";
import { logout } from "./actions";

const ROLE_LABELS: Record<string, string> = {
  consumidor: "Consumidor Circular",
  produtor: "Produtor Circular",
  cooperativa: "Cooperativa",
  admin: "Administrador",
};

const PARTNER_CATEGORY_LABELS: Record<string, string> = {
  restaurante: "Restaurante",
  hotel: "Hotel",
  produtor_local: "Produtor local",
  shopping: "Shopping",
  servico: "Serviço",
  outro: "Parceiro",
};

const STATUS_LABELS: Record<string, string> = {
  requested: "Solicitada",
  confirmed: "Confirmada",
  canceled: "Cancelada",
};

const WASTE_LABELS: Record<string, string> = {
  organic: "Orgânico",
  solid: "Seco",
  both: "Orgânico + Seco",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export default async function InicioPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "consumidor") {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, plans(name, audience, benefits)")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!subscription) {
      redirect("/onboarding/plano");
    }

    const { data: collections } = await supabase
      .from("collection_requests")
      .select("id, waste_type, status, estimated_weight_kg, confirmed_weight_kg, requested_at")
      .eq("requester_id", user.id)
      .order("requested_at", { ascending: false })
      .limit(5);

    const confirmedKg = (collections ?? [])
      .filter((c) => c.status === "confirmed")
      .reduce((sum, c) => sum + (c.confirmed_weight_kg ?? 0), 0);

    const co2Avoided = estimatedCo2AvoidedKg(confirmedKg);

    const benefits = Array.isArray(subscription.plans?.benefits)
      ? (subscription.plans?.benefits as unknown[])
      : [];
    const nextBenefit = typeof benefits[0] === "string" ? (benefits[0] as string) : null;

    const { data: featuredPartners } = await supabase
      .from("partners")
      .select("id, name, category, address, seal")
      .eq("status", "active")
      .order("name")
      .limit(3);

    return (
      <div className="dashboard-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Olá,</p>
            <h1 className="font-heading text-2xl font-semibold text-cc-green">{profile.name}</h1>
          </div>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              Sair
            </Button>
          </form>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Seu plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-lg font-medium text-cc-green">{subscription.plans?.name ?? "—"}</p>
              <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                {subscription.status === "active"
                  ? "Ativo"
                  : subscription.status === "pending"
                    ? "Aguardando ativação"
                    : "Cancelado"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seus pontos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-cc-orange">{profile.points_balance}</p>
              <p className="text-sm text-muted-foreground">pontos acumulados</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
              <Recycle className="h-5 w-5 text-cc-green" />
              <CardTitle>Resíduos destinados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-cc-green">{confirmedKg.toFixed(1)} kg</p>
              <p className="text-sm text-muted-foreground">total confirmado em coletas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
              <Leaf className="h-5 w-5 text-cc-green" />
              <CardTitle>CO₂ evitado (estimativa)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-cc-green">{co2Avoided.toFixed(1)} kg</p>
              <p className="text-sm text-muted-foreground">{CO2_ESTIMATE_LABEL}</p>
            </CardContent>
          </Card>
        </div>

        {nextBenefit ? (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
              <Sparkles className="h-5 w-5 text-cc-orange" />
              <CardTitle>Próximo benefício</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{nextBenefit}</CardContent>
          </Card>
        ) : null}

        {featuredPartners && featuredPartners.length > 0 ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Parceiros em destaque</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/loja?aba=parceiros">Ver todos</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {featuredPartners.map((partner) => (
                <Link
                  key={partner.id}
                  href={`/loja/parceiros/${partner.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm transition-colors hover:border-cc-orange"
                >
                  <div>
                    <p className="font-medium text-cc-green">{partner.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {partner.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {partner.seal ? (
                      <Badge variant="secondary" className="gap-1 whitespace-nowrap">
                        <Leaf className="h-3 w-3" />
                        Selo
                      </Badge>
                    ) : null}
                    <Badge variant="outline" className="whitespace-nowrap">
                      {PARTNER_CATEGORY_LABELS[partner.category] ?? partner.category}
                    </Badge>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Minhas coletas</CardTitle>
            <Button asChild size="sm">
              <Link href="/coletas/nova">Solicitar coleta</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {collections && collections.length > 0 ? (
              collections.map((collection) => (
                <div
                  key={collection.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-cc-green">{WASTE_LABELS[collection.waste_type]}</p>
                    <p className="text-muted-foreground">{formatDate(collection.requested_at)}</p>
                  </div>
                  <Badge
                    variant={
                      collection.status === "confirmed"
                        ? "default"
                        : collection.status === "canceled"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {STATUS_LABELS[collection.status]}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Você ainda não solicitou nenhuma coleta.
              </p>
            )}
            <Button asChild variant="ghost" size="sm" className="w-full justify-between">
              <Link href="/coletas">
                Ver todas as coletas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile.role === "produtor") {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, plans(name, audience, benefits)")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!subscription) {
      redirect("/onboarding/plano");
    }

    const { data: collections } = await supabase
      .from("collection_requests")
      .select("id, waste_type, status, estimated_weight_kg, confirmed_weight_kg, requested_at")
      .eq("requester_id", user.id)
      .order("requested_at", { ascending: false })
      .limit(5);

    const confirmedKg = (collections ?? [])
      .filter((c) => c.status === "confirmed")
      .reduce((sum, c) => sum + (c.confirmed_weight_kg ?? 0), 0);

    const co2Avoided = confirmedKg * 0.5;

    const { data: myProducts } = await supabase
      .from("products")
      .select("id, name, price_cents, points_value, image_url, status, approved, created_at")
      .eq("partner_id", user.id)
      .order("created_at", { ascending: false });

    const counts = (myProducts ?? []).reduce(
      (acc, product) => {
        const { label } = listingStatus(product);
        if (label === "Publicado") acc.published += 1;
        else if (label === "Em análise") acc.analysis += 1;
        else if (label === "Pausado") acc.paused += 1;
        else acc.rejected += 1;
        return acc;
      },
      { published: 0, analysis: 0, paused: 0, rejected: 0 },
    );

    const recentProducts = (myProducts ?? []).slice(0, 3);

    return (
      <div className="dashboard-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Olá,</p>
            <h1 className="font-heading text-2xl font-semibold text-cc-green">{profile.name}</h1>
          </div>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              Sair
            </Button>
          </form>
        </header>

        <Card className="dashboard-store-card">
          {profile.store_image_url ? (
            <div className="relative h-24 w-full overflow-hidden rounded-t-xl bg-cc-cream/50">
              <Image
                src={profile.store_image_url}
                alt={profile.store_name ?? profile.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
          ) : null}
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Minha loja</CardTitle>
            <Store className="h-5 w-5 text-cc-green" />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="font-semibold text-foreground">{profile.store_name ?? profile.name}</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/perfil/loja">Editar loja</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="dashboard-listings-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Meus anúncios</CardTitle>
            <Button asChild size="sm">
              <Link href="/loja/produtos/novo">Anunciar produto</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-2xl font-semibold text-cc-green">{counts.published}</p>
                <p className="text-xs text-muted-foreground">Publicados</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-2xl font-semibold text-cc-orange">{counts.analysis}</p>
                <p className="text-xs text-muted-foreground">Em análise</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-2xl font-semibold text-muted-foreground">{counts.paused}</p>
                <p className="text-xs text-muted-foreground">Pausados</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-2xl font-semibold text-destructive">{counts.rejected}</p>
                <p className="text-xs text-muted-foreground">Recusados</p>
              </div>
            </div>

            {recentProducts.length > 0 ? (
              <div className="space-y-2">
                {recentProducts.map((product) => {
                  const status = listingStatus(product);
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-cc-cream/50">
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
                              <Package className="h-4 w-4 text-cc-sand" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-cc-green">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{formatPrice(product.price_cents)}</p>
                        </div>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Você ainda não tem anúncios. Que tal criar o primeiro?
              </p>
            )}

            <Button asChild variant="ghost" size="sm" className="w-full justify-between">
              <Link href="/loja/produtos">
                Ver todos os anúncios
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="dashboard-impact space-y-3">
          <h2 className="font-heading text-lg font-semibold text-cc-green">Resumo de impacto</h2>
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="space-y-1 text-center">
                <p className="text-xl font-semibold text-cc-green">{confirmedKg.toFixed(1)} kg</p>
                <p className="text-xs text-muted-foreground">Resíduos destinados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1 text-center">
                <p className="text-xl font-semibold text-cc-green">{co2Avoided.toFixed(1)} kg</p>
                <p className="text-xs text-muted-foreground">CO₂ evitado</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1 text-center">
                <p className="text-xl font-semibold text-cc-orange">{profile.points_balance}</p>
                <p className="text-xs text-muted-foreground">Pontos</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="dashboard-collections-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Minhas coletas</CardTitle>
            <Button asChild size="sm">
              <Link href="/coletas/nova">Solicitar coleta</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {collections && collections.length > 0 ? (
              collections.map((collection) => (
                <div
                  key={collection.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-cc-green">{WASTE_LABELS[collection.waste_type]}</p>
                    <p className="text-muted-foreground">{formatDate(collection.requested_at)}</p>
                  </div>
                  <Badge
                    variant={
                      collection.status === "confirmed"
                        ? "default"
                        : collection.status === "canceled"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {STATUS_LABELS[collection.status]}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Você ainda não solicitou nenhuma coleta.
              </p>
            )}
            <Button asChild variant="ghost" size="sm" className="w-full justify-between">
              <Link href="/coletas">
                Ver todas as coletas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile.role === "cooperativa") {
    const { data: cooperative } = await supabase
      .from("cooperatives")
      .select("id, name, type, status")
      .eq("profile_id", user.id)
      .maybeSingle();

    let pendingCount = 0;
    let confirmedCount = 0;

    if (cooperative) {
      const { count: pending } = await supabase
        .from("collection_requests")
        .select("id", { count: "exact", head: true })
        .eq("cooperative_id", cooperative.id)
        .eq("status", "requested");

      const { count: confirmed } = await supabase
        .from("collection_requests")
        .select("id", { count: "exact", head: true })
        .eq("cooperative_id", cooperative.id)
        .eq("status", "confirmed");

      pendingCount = pending ?? 0;
      confirmedCount = confirmed ?? 0;
    }

    return (
      <div className="dashboard-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Olá,</p>
            <h1 className="font-heading text-2xl font-semibold text-cc-green">
              {cooperative?.name ?? profile.name}
            </h1>
            <Badge variant="secondary" className="mt-2">
              {ROLE_LABELS[profile.role]}
            </Badge>
          </div>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm">
              Sair
            </Button>
          </form>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Coletas pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-cc-orange">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">aguardando confirmação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coletas confirmadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-cc-green">{confirmedCount}</p>
              <p className="text-sm text-muted-foreground">já concluídas</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fila de coletas</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full justify-between">
              <Link href="/coletas">
                Gerenciar coletas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile.role === "admin") {
    const { count: pendingCount } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("approved", false);

    return (
      <div className="dashboard-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
        <header>
          <p className="text-sm text-muted-foreground">Olá,</p>
          <h1 className="font-heading text-2xl font-semibold text-cc-green">{profile.name}</h1>
          <Badge variant="secondary" className="mt-2">
            {ROLE_LABELS[profile.role]}
          </Badge>
        </header>

        <Link href="/perfil#aprovacoes">
          <Card className="transition-colors hover:border-cc-orange">
            <CardContent className="flex items-center justify-between py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cc-orange/10">
                  <Package className="h-5 w-5 text-cc-orange" />
                </div>
                <div>
                  <p className="font-medium text-cc-green">Aprovações pendentes</p>
                  <p className="text-sm text-muted-foreground">
                    {pendingCount ? `${pendingCount} produto${pendingCount > 1 ? "s" : ""} aguardando revisão` : "Tudo em dia!"}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="py-5 text-center">
            <p className="text-sm text-muted-foreground">
              Use a navegação abaixo para explorar o Marketplace e demais seções como qualquer usuário.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  redirect("/login");
}
