import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Package, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SalesTrendChart } from "@/components/charts/sales-trend-chart";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";

const PERIODS = [
  { days: 7, label: "7 dias" },
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
];

function formatDelta(current: number, previous: number) {
  if (previous <= 0) return null;
  const change = ((current - previous) / previous) * 100;
  return Math.round(change);
}

export default async function ProducerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo } = await searchParams;
  const days = PERIODS.some((p) => String(p.days) === periodo) ? Number(periodo) : 30;

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

  const [{ data: summaryRows }, { data: dailyRows }, { data: topRows }, { data: lowStock }] = await Promise.all([
    supabase.rpc("get_partner_sales_summary", { p_days: days }),
    supabase.rpc("get_partner_sales_daily", { p_days: days }),
    supabase.rpc("get_partner_top_products", { p_days: days, p_limit: 5 }),
    supabase
      .from("products")
      .select("id, name, stock")
      .eq("partner_id", user.id)
      .eq("status", "active")
      .lte("stock", 5)
      .order("stock", { ascending: true }),
  ]);

  const summary = summaryRows?.[0] ?? {
    gmv_cents: 0,
    orders_count: 0,
    units_count: 0,
    avg_ticket_cents: 0,
    prev_gmv_cents: 0,
    prev_orders_count: 0,
  };
  const trend = (dailyRows ?? []).map((row) => ({ day: row.day, gmvCents: row.gmv_cents }));
  const topProducts = topRows ?? [];
  const maxTopGmv = Math.max(1, ...topProducts.map((p) => p.gmv_cents));
  const gmvDelta = formatDelta(summary.gmv_cents, summary.prev_gmv_cents);
  const ordersDelta = formatDelta(summary.orders_count, summary.prev_orders_count);

  return (
    <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <Link href="/loja/produtos" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para meus anúncios
        </Link>
      </div>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-cc-green">Métricas de vendas</h1>
          <p className="text-sm text-muted-foreground">Desempenho dos seus anúncios no Marketplace.</p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((period) => (
            <Link key={period.days} href={`/loja/dashboard?periodo=${period.days}`}>
              <Badge variant={days === period.days ? "default" : "secondary"}>{period.label}</Badge>
            </Link>
          ))}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">GMV no período</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="font-heading text-2xl font-semibold text-cc-green">{formatPrice(summary.gmv_cents)}</span>
            {gmvDelta !== null ? (
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium ${gmvDelta >= 0 ? "text-cc-green" : "text-destructive"}`}
              >
                {gmvDelta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {gmvDelta >= 0 ? "+" : ""}
                {gmvDelta}%
              </span>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="font-heading text-2xl font-semibold text-cc-green">{summary.orders_count}</span>
            {ordersDelta !== null ? (
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium ${ordersDelta >= 0 ? "text-cc-green" : "text-destructive"}`}
              >
                {ordersDelta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {ordersDelta >= 0 ? "+" : ""}
                {ordersDelta}%
              </span>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket médio</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-heading text-2xl font-semibold text-cc-green">
              {formatPrice(summary.avg_ticket_cents)}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Unidades vendidas</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-heading text-2xl font-semibold text-cc-green">{summary.units_count}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendas por dia</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesTrendChart data={trend} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos mais vendidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topProducts.length > 0 && topProducts.some((p) => p.gmv_cents > 0) ? (
            topProducts.map((product) => (
              <div key={product.product_id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="line-clamp-1 font-medium text-foreground">{product.name}</span>
                  <span className="whitespace-nowrap font-semibold text-cc-green">{formatPrice(product.gmv_cents)}</span>
                </div>
                <Progress value={(product.gmv_cents / maxTopGmv) * 100} />
                <p className="text-xs text-muted-foreground">
                  {product.units_sold} vendidos · {product.view_count} visualizações
                  {product.view_count > 0 ? ` · ${(product.conversion_rate * 100).toFixed(1)}% conversão` : ""}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-muted-foreground">Nenhuma venda registrada neste período.</p>
          )}
        </CardContent>
      </Card>

      {lowStock && lowStock.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-cc-orange" />
              Estoque baixo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStock.map((product) => (
              <div key={product.id} className="flex items-center justify-between text-sm">
                <Link href={`/loja/produtos/${product.id}/editar`} className="line-clamp-1 text-foreground hover:underline">
                  {product.name}
                </Link>
                <Badge variant={product.stock === 0 ? "destructive" : "secondary"}>
                  {product.stock === 0 ? "Sem estoque" : `${product.stock} restantes`}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
