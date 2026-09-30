import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Medal, Package, Sparkles, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeLevel, describeBenefits } from "@/lib/gamification";
import { createClient } from "@/lib/supabase/server";
import { approveProduct, logout, rejectProduct } from "../inicio/actions";

const ROLE_LABELS: Record<string, string> = {
  consumidor: "Consumidor Circular",
  produtor: "Produtor Circular",
  cooperativa: "Cooperativa",
  admin: "Administrador",
};

const COOPERATIVE_TYPE_LABELS: Record<string, string> = {
  organic: "Resíduos orgânicos",
  solid: "Resíduos secos",
  both: "Resíduos orgânicos e secos",
};

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  pending: "Aguardando ativação",
  canceled: "Cancelado",
};

const ORDER_STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Aguardando pagamento", variant: "secondary" },
  approved: { label: "Aprovado", variant: "default" },
  canceled: { label: "Cancelado", variant: "destructive" },
};

/** Quantos pedidos o perfil mostra antes de mandar para a lista completa. */
const RECENT_ORDERS = 5;

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function PerfilPage() {
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

  let subscription: { status: string; plans: { name: string } | null } | null = null;
  let recentOrders:
    | {
        id: string;
        order_code: string;
        status: string;
        total_cents: number;
        total_points: number;
        created_at: string;
      }[]
    | null = null;
  let wasteStats: { totalKg: number; confirmedCount: number } | null = null;
  let cooperative: {
    name: string;
    type: string;
    status: string;
    service_area: string | null;
    capacity_kg_day: number | null;
  } | null = null;
  let pendingProducts: {
    id: string;
    name: string;
    description: string | null;
    price_cents: number;
    image_url: string | null;
    partner_id: string;
  }[] | null = null;
  let producerById = new Map<string, { id: string; name: string; store_name: string | null }>();

  if (profile.role === "admin") {
    const { data } = await supabase
      .from("products")
      .select("id, name, description, price_cents, image_url, partner_id")
      .eq("status", "active")
      .eq("approved", false)
      .order("created_at", { ascending: true });
    pendingProducts = data ?? [];

    const partnerIds = Array.from(new Set(pendingProducts.map((p) => p.partner_id)));
    if (partnerIds.length > 0) {
      const { data: producers } = await supabase
        .from("profiles")
        .select("id, name, store_name")
        .in("id", partnerIds);
      producerById = new Map((producers ?? []).map((p) => [p.id, p]));
    }
  }

  if (profile.role === "consumidor" || profile.role === "produtor") {
    const { data } = await supabase
      .from("subscriptions")
      .select("status, plans(name)")
      .eq("profile_id", user.id)
      .maybeSingle();
    subscription = data;

    const { data: orders } = await supabase
      .from("orders")
      .select("id, order_code, status, total_cents, total_points, created_at")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(RECENT_ORDERS);
    recentOrders = orders ?? [];

    if (profile.role === "produtor") {
      const { data: collections } = await supabase
        .from("collection_requests")
        .select("status, confirmed_weight_kg")
        .eq("requester_id", user.id);

      const confirmed = (collections ?? []).filter((c) => c.status === "confirmed");
      wasteStats = {
        totalKg: confirmed.reduce((sum, c) => sum + (c.confirmed_weight_kg ?? 0), 0),
        confirmedCount: confirmed.length,
      };
    }
  }

  if (profile.role === "cooperativa") {
    const { data } = await supabase
      .from("cooperatives")
      .select("name, type, status, service_area, capacity_kg_day")
      .eq("profile_id", user.id)
      .maybeSingle();
    cooperative = data;
  }

  const isMember = profile.role === "consumidor" || profile.role === "produtor";
  const level = computeLevel(profile.lifetime_points ?? 0);
  const unlockedBenefits = describeBenefits(level.current.benefits);

  return (
    <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold text-cc-green">Perfil</h1>
        <p className="text-sm text-muted-foreground">Seus dados cadastrais.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{profile.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Badge variant="secondary">{ROLE_LABELS[profile.role] ?? profile.role}</Badge>

          <div>
            <p className="text-muted-foreground">E-mail</p>
            <p className="font-medium text-cc-green">{profile.email}</p>
          </div>

          {profile.phone ? (
            <div>
              <p className="text-muted-foreground">Telefone</p>
              <p className="font-medium text-cc-green">{profile.phone}</p>
            </div>
          ) : null}

          {profile.document ? (
            <div>
              <p className="text-muted-foreground">CPF / CNPJ</p>
              <p className="font-medium text-cc-green">{profile.document}</p>
            </div>
          ) : null}

          <div>
            <p className="text-muted-foreground">Saldo de pontos</p>
            <p className="font-medium text-cc-orange">{profile.points_balance}</p>
          </div>
        </CardContent>
      </Card>

      {isMember ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-cc-orange" />
              Clube de Benefícios
            </CardTitle>
            <Badge variant="secondary">{level.current.name}</Badge>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-cc-orange transition-all"
                  style={{ width: `${Math.round(level.progress * 100)}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>{profile.lifetime_points ?? 0} pts acumulados</span>
                <span>
                  {level.next ? `Faltam ${level.pointsForNext} pts para ${level.next.name}` : "Nível máximo"}
                </span>
              </div>
            </div>

            {unlockedBenefits.length > 0 ? (
              <ul className="space-y-1 text-foreground/80">
                {unlockedBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-1.5">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cc-green" />
                    {benefit}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">
                Recicle e compre na loja para destravar os primeiros benefícios do clube.
              </p>
            )}

            <Button asChild variant="outline" className="w-full">
              <Link href="/pontos">Ver níveis e recompensas</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {profile.role === "produtor" ? (
        <Card>
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
            <div>
              <p className="font-semibold text-foreground">{profile.store_name ?? profile.name}</p>
              {profile.store_description ? (
                <p className="line-clamp-2 text-foreground/80">{profile.store_description}</p>
              ) : (
                <p className="text-muted-foreground">
                  Adicione uma descrição e um banner para sua loja aparecer no Marketplace.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/perfil/loja">Editar loja</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/loja/produtos">Meus anúncios</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {subscription ? (
        <Card>
          <CardHeader>
            <CardTitle>Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium text-cc-green">{subscription.plans?.name ?? "—"}</p>
            <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
              {SUBSCRIPTION_STATUS_LABELS[subscription.status] ?? subscription.status}
            </Badge>
          </CardContent>
        </Card>
      ) : null}

      {recentOrders ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Meus pedidos</CardTitle>
            <Link href="/loja/pedidos" className="text-sm font-medium text-cc-orange">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => {
                const status = ORDER_STATUS_LABELS[order.status] ?? ORDER_STATUS_LABELS["pending"];
                return (
                  <Link
                    key={order.id}
                    href={`/loja/pedidos/${order.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm transition-colors hover:border-cc-orange"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs text-muted-foreground">{order.order_code}</p>
                      <Badge variant={status.variant} className="text-xs">
                        {status.label}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="text-right">
                        <p className="font-semibold text-cc-green">{formatPrice(order.total_cents)}</p>
                        {order.total_points > 0 ? (
                          <p className="text-xs text-cc-orange">
                            {order.status === "approved" ? "+" : ""}
                            {order.total_points} pts
                          </p>
                        ) : null}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">Você ainda não fez pedidos na loja.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {cooperative ? (
        <Card>
          <CardHeader>
            <CardTitle>Dados da cooperativa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Badge variant={cooperative.status === "active" ? "default" : "secondary"}>
              {cooperative.status === "active" ? "Ativa" : "Inativa"}
            </Badge>
            <div>
              <p className="text-muted-foreground">Tipo de coleta</p>
              <p className="font-medium text-cc-green">
                {COOPERATIVE_TYPE_LABELS[cooperative.type] ?? cooperative.type}
              </p>
            </div>
            {cooperative.service_area ? (
              <div>
                <p className="text-muted-foreground">Área de atendimento</p>
                <p className="font-medium text-cc-green">{cooperative.service_area}</p>
              </div>
            ) : null}
            {cooperative.capacity_kg_day ? (
              <div>
                <p className="text-muted-foreground">Capacidade diária</p>
                <p className="font-medium text-cc-green">{cooperative.capacity_kg_day} kg/dia</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {wasteStats ? (
        <Card>
          <CardHeader>
            <CardTitle>Indicadores de resíduos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-2xl font-semibold text-cc-green">{wasteStats.totalKg.toFixed(1)} kg</p>
              <p className="text-muted-foreground">total destinado</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-cc-green">{wasteStats.confirmedCount}</p>
              <p className="text-muted-foreground">coletas confirmadas</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {pendingProducts !== null ? (
        <Card id="aprovacoes">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Aprovações pendentes</CardTitle>
            <Badge variant="secondary">{pendingProducts.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingProducts.length > 0 ? (
              pendingProducts.map((product) => {
                const producer = producerById.get(product.partner_id);
                return (
                  <div key={product.id} className="space-y-3 rounded-lg border border-border p-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-cc-cream/50">
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
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-cc-green">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {producer?.store_name ?? producer?.name ?? "—"} · R${" "}
                          {(product.price_cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                        {product.description ? (
                          <p className="line-clamp-2 text-xs text-foreground/80">{product.description}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <form action={approveProduct} className="flex-1">
                        <input type="hidden" name="product_id" value={product.id} />
                        <Button type="submit" size="sm" className="w-full">
                          Aprovar
                        </Button>
                      </form>
                      <form action={rejectProduct} className="flex-1">
                        <input type="hidden" name="product_id" value={product.id} />
                        <Button type="submit" size="sm" variant="outline" className="w-full">
                          Recusar
                        </Button>
                      </form>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum anúncio aguardando aprovação.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      <form action={logout}>
        <Button type="submit" variant="outline" className="w-full">
          Sair
        </Button>
      </form>
    </div>
  );
}
