import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Package,
  PartyPopper,
  QrCode,
  Sparkles,
  Star,
  Truck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderTimeline } from "@/components/order-timeline";
import { OrderReviewForm } from "@/components/order-review-form";
import { createClient } from "@/lib/supabase/server";

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive"; color: string }
> = {
  pending: {
    label: "Aguardando pagamento",
    icon: <Clock className="h-4 w-4" />,
    variant: "secondary",
    color: "text-cc-orange",
  },
  approved: {
    label: "Aprovado",
    icon: <CheckCircle2 className="h-4 w-4" />,
    variant: "default",
    color: "text-cc-green",
  },
  canceled: {
    label: "Cancelado",
    icon: <XCircle className="h-4 w-4" />,
    variant: "destructive",
    color: "text-destructive",
  },
};

const PAYMENT_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  pix: { label: "PIX", icon: <QrCode className="h-4 w-4" /> },
  credit_card: { label: "Cartão de crédito", icon: <CreditCard className="h-4 w-4" /> },
  boleto: { label: "Boleto bancário", icon: <Package className="h-4 w-4" /> },
};

const SHIPMENT_STATUS: Record<
  string,
  { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" }
> = {
  preparing: { label: "Preparando", icon: <Clock className="h-3.5 w-3.5" />, variant: "secondary" },
  collected: { label: "Coletado", icon: <Package className="h-3.5 w-3.5" />, variant: "secondary" },
  shipped: { label: "Em transporte", icon: <Truck className="h-3.5 w-3.5" />, variant: "default" },
  delivered: { label: "Entregue", icon: <CheckCircle2 className="h-3.5 w-3.5" />, variant: "default" },
  canceled: { label: "Cancelado", icon: <XCircle className="h-3.5 w-3.5" />, variant: "destructive" },
};

export default async function PedidoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ confirmado?: string; erro_pagamento?: string; avaliado?: string; erro_avaliacao?: string }>;
}) {
  const { id } = await params;
  const { confirmado, erro_pagamento, avaliado, erro_avaliacao } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_code, status, total_cents, total_points, freight_cents, level_discount_cents, payment_method, payment_url, delivery_address, created_at, order_items(id, quantity, unit_price_cents, points_value, products(id, name, image_url))",
    )
    .eq("id", id)
    .eq("buyer_id", user.id)
    .single();

  if (!order) notFound();

  const { data: shipments } = await supabase
    .from("order_shipments")
    .select("id, status, carrier, tracking_code, collected_at, shipped_at, delivered_at")
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  const allDelivered = Boolean(shipments?.length) && shipments!.every((s) => s.status === "delivered");
  const deliveredAt = allDelivered
    ? shipments!.reduce<string | null>((latest, s) => {
        if (!s.delivered_at) return latest;
        return !latest || s.delivered_at > latest ? s.delivered_at : latest;
      }, null)
    : null;

  const { data: review } = await supabase
    .from("order_reviews")
    .select("rating, comment, photo_paths")
    .eq("order_id", id)
    .maybeSingle();

  const reviewPhotos: string[] = [];
  for (const path of review?.photo_paths ?? []) {
    const { data: signed } = await supabase.storage.from("review-photos").createSignedUrl(path, 60 * 60);
    if (signed?.signedUrl) reviewPhotos.push(signed.signedUrl);
  }

  // total_cents já entra líquido do desconto de nível, então o subtotal bruto
  // precisa somá-lo de volta para a conta fechar na tela.
  const levelDiscountCents = order.level_discount_cents ?? 0;
  const goodsCents = order.total_cents - (order.freight_cents ?? 0) + levelDiscountCents;
  const itemCount = (order.order_items ?? []).reduce((sum, item) => sum + item.quantity, 0);

  const statusConfig = STATUS_CONFIG[order.status] ?? STATUS_CONFIG["pending"];
  const paymentInfo = PAYMENT_LABELS[(order.payment_method as string) ?? "pix"];
  const address = order.delivery_address as Record<string, string> | null;

  return (
    <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <Link href="/loja/pedidos" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" />
        Meus pedidos
      </Link>

      {/* Confirmation banner */}
      {confirmado === "1" ? (
        <div className="flex items-start gap-3 rounded-xl border border-cc-green/30 bg-cc-green/8 px-4 py-4 text-cc-green">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Pedido realizado com sucesso!</p>
            <p className="mt-0.5 text-sm text-cc-green/80">
              Acompanhe o status abaixo e siga as instruções de pagamento.
            </p>
          </div>
        </div>
      ) : null}

      {avaliado === "1" ? (
        <div className="flex items-start gap-3 rounded-xl border border-cc-green/30 bg-cc-green/8 px-4 py-4 text-cc-green">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Avaliação enviada!</p>
            <p className="mt-0.5 text-sm text-cc-green/80">Obrigado por contar como foi sua experiência.</p>
          </div>
        </div>
      ) : null}

      {erro_pagamento === "1" ? (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-4 text-destructive">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Não foi possível iniciar o pagamento.</p>
            <p className="mt-0.5 text-sm">
              Seu pedido foi registrado, mas houve um problema ao gerar a cobrança. Verifique se seu CPF está preenchido
              no perfil e tente novamente.
            </p>
          </div>
        </div>
      ) : null}

      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-cc-green">Pedido {order.order_code}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
        </div>
        <Badge variant={statusConfig.variant} className="flex items-center gap-1">
          {statusConfig.icon}
          {statusConfig.label}
        </Badge>
      </header>

      {/* Order items */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(order.order_items ?? []).map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cc-cream/50">
                {item.products?.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.products.image_url}
                    alt={item.products.name ?? "Produto"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-5 w-5 text-cc-sand" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-cc-green">{item.products?.name ?? "Produto"}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity}x {formatPrice(item.unit_price_cents)}
                </p>
              </div>
              <p className="text-sm font-semibold text-cc-green">
                {formatPrice(item.unit_price_cents * item.quantity)}
              </p>
            </div>
          ))}

          <div className="space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatPrice(goodsCents)}</span>
            </div>
            {levelDiscountCents > 0 ? (
              <div className="flex justify-between text-cc-green">
                <span>Desconto do clube</span>
                <span>-{formatPrice(levelDiscountCents)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-muted-foreground">
              <span>Frete</span>
              <span>{(order.freight_cents ?? 0) > 0 ? formatPrice(order.freight_cents) : "Grátis"}</span>
            </div>
            <div className="flex justify-between font-semibold text-cc-green">
              <span>Total</span>
              <span>{formatPrice(order.total_cents)}</span>
            </div>
            {order.total_points > 0 ? (
              <p className="flex items-center gap-1 pt-1 text-xs text-cc-orange">
                <Sparkles className="h-3.5 w-3.5" />
                {order.status === "approved"
                  ? `+${order.total_points} pontos creditados`
                  : `+${order.total_points} pontos ao confirmar o pagamento`}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Payment instructions */}
      {order.status === "pending" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {paymentInfo?.icon}
              {paymentInfo?.label ?? "Pagamento"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.payment_url ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Finalize o pagamento na página segura do Asaas. Assim que o pagamento for confirmado, seu pedido é
                  aprovado automaticamente e os pontos são creditados.
                </p>
                <Button asChild size="lg" className="w-full">
                  <a href={order.payment_url} target="_blank" rel="noreferrer">
                    Pagar agora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Estamos gerando sua cobrança. Atualize a página em instantes para acessar o pagamento.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Shipment tracking */}
      {shipments && shipments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Entrega{shipments.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {shipments.map((shipment, index) => {
              const s = SHIPMENT_STATUS[shipment.status] ?? SHIPMENT_STATUS.preparing;
              return (
                <div key={shipment.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-medium text-cc-green">
                      {shipments.length > 1 ? `Envio ${index + 1}` : "Status"}
                    </span>
                    <Badge variant={s.variant} className="flex items-center gap-1">
                      {s.icon}
                      {s.label}
                    </Badge>
                  </div>
                  <OrderTimeline
                    status={shipment.status}
                    confirmedAt={order.created_at}
                    collectedAt={shipment.collected_at}
                    shippedAt={shipment.shipped_at}
                    deliveredAt={shipment.delivered_at}
                  />
                  {shipment.tracking_code ? (
                    <p className="mt-3 border-t border-border pt-3 text-muted-foreground">
                      {shipment.carrier ? `${shipment.carrier} · ` : ""}
                      Rastreio: <span className="font-medium text-cc-green">{shipment.tracking_code}</span>
                    </p>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {/* "Seu pedido chegou" — shown once every shipment is delivered. Only a
          plain summary, no impact estimates: we don't measure per-order
          environmental impact yet, so we don't claim a number for it. */}
      {allDelivered ? (
        <Card className="border-cc-green/30 bg-cc-green/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cc-green">
              <PartyPopper className="h-5 w-5" />
              Seu pedido chegou!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-cc-green/80">
              {itemCount} {itemCount === 1 ? "item entregue" : "itens entregues"}
              {deliveredAt ? ` em ${formatDate(deliveredAt)}` : ""} · Total {formatPrice(order.total_cents)}
            </p>

            {review ? (
              <div className="space-y-3 border-t border-cc-green/15 pt-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= review.rating ? "fill-cc-orange text-cc-orange" : "fill-transparent text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                {review.comment ? <p className="text-sm text-cc-green/90">{review.comment}</p> : null}
                {reviewPhotos.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {reviewPhotos.map((url) => (
                      <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border border-cc-green/15">
                        <Image src={url} alt="Foto da avaliação" fill sizes="80px" className="object-cover" unoptimized />
                      </div>
                    ))}
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground">Você já avaliou este pedido.</p>
              </div>
            ) : (
              <div className="border-t border-cc-green/15 pt-4">
                <OrderReviewForm orderId={order.id} userId={user.id} error={erro_avaliacao} />
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Delivery address */}
      {address ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço de entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              {address.street}, {address.number}
              {address.complement ? `, ${address.complement}` : ""}
            </p>
            {address.neighborhood ? <p>{address.neighborhood}</p> : null}
            <p>
              {address.city} – {address.state}
            </p>
            <p>CEP: {address.cep}</p>
          </CardContent>
        </Card>
      ) : null}

      <Button asChild variant="outline" className="w-full">
        <Link href="/loja">
          Continuar comprando
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
