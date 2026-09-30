import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Package, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Aguardando pagamento", variant: "secondary" },
  approved: { label: "Aprovado", variant: "default" },
  canceled: { label: "Cancelado", variant: "destructive" },
};

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function MeusPedidosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, order_code, status, total_cents, total_points, payment_method, created_at, order_items(id, quantity, products(name))",
    )
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  const PAYMENT_LABELS: Record<string, string> = {
    pix: "PIX",
    credit_card: "Cartão",
    boleto: "Boleto",
  };

  return (
    <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <Link href="/loja" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        Voltar para a loja
      </Link>

      <header>
        <h1 className="font-heading text-2xl font-semibold text-cc-green">Meus pedidos</h1>
        <p className="text-sm text-muted-foreground">Acompanhe o status e detalhes dos seus pedidos.</p>
      </header>

      {orders && orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status] ?? STATUS_CONFIG["pending"];
            const itemNames = (order.order_items ?? [])
              .map((i) => i.products?.name)
              .filter(Boolean)
              .join(", ");

            return (
              <Link key={order.id} href={`/loja/pedidos/${order.id}`} className="block">
                <Card className="transition-colors hover:border-cc-orange">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">{order.order_code}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusConfig.variant} className="shrink-0 text-xs">
                            {statusConfig.label}
                          </Badge>
                          {order.payment_method ? (
                            <span className="text-xs text-muted-foreground">
                              {PAYMENT_LABELS[order.payment_method as string] ?? order.payment_method}
                            </span>
                          ) : null}
                        </div>
                        {itemNames ? (
                          <p className="line-clamp-1 text-sm text-muted-foreground">{itemNames}</p>
                        ) : (
                          <p className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Package className="h-3.5 w-3.5" />
                            {order.order_items?.length ?? 0}{" "}
                            {(order.order_items?.length ?? 0) === 1 ? "item" : "itens"}
                          </p>
                        )}
                        <div className="flex items-center gap-3 pt-0.5">
                          <span className="font-semibold text-cc-green">{formatPrice(order.total_cents)}</span>
                          {order.total_points > 0 ? (
                            <span className="flex items-center gap-1 text-xs text-cc-orange">
                              <Sparkles className="h-3 w-3" />
                              {order.status === "approved"
                                ? `+${order.total_points} pts`
                                : `${order.total_points} pts pendentes`}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(order.created_at)}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-14 text-center">
            <Package className="mb-4 h-12 w-12 text-muted-foreground/25" />
            <p className="font-heading text-lg font-semibold text-cc-green">Nenhum pedido ainda</p>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">
              Explore a loja e faça seu primeiro pedido
            </p>
            <Link
              href="/loja"
              className="inline-flex h-10 items-center rounded-lg bg-cc-green px-4 text-sm font-medium text-white"
            >
              Explorar loja
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
