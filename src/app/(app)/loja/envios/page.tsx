import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, MapPin, Package, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { markShipmentCollected, markShipmentDelivered, markShipmentShipped } from "./actions";

type ShipmentItem = { name: string; quantity: number; image_url: string | null; unit_price_cents: number };
type Address = Record<string, string> | null;

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  preparing: { label: "A enviar", variant: "secondary" },
  collected: { label: "Coletado", variant: "secondary" },
  shipped: { label: "Em transporte", variant: "default" },
  delivered: { label: "Entregue", variant: "default" },
  canceled: { label: "Cancelado", variant: "destructive" },
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function EnviosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "produtor") redirect("/inicio");

  const { data: shipments } = await supabase.rpc("get_partner_shipments");
  const rows = shipments ?? [];

  return (
    <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <Link href="/loja/produtos" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para meus anúncios
        </Link>
      </div>

      <header>
        <h1 className="font-heading text-2xl font-semibold text-cc-green">Pedidos a enviar</h1>
        <p className="text-sm text-muted-foreground">Prepare, despache e acompanhe as entregas dos seus produtos.</p>
      </header>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            <Package className="mx-auto mb-3 h-8 w-8 text-cc-sand" />
            Nenhum pedido para enviar ainda. Assim que um pedido com seus produtos for pago, ele aparece aqui.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((shipment) => {
            const status = STATUS_LABELS[shipment.status] ?? STATUS_LABELS.preparing;
            const address = shipment.delivery_address as Address;
            const items = (shipment.items as ShipmentItem[] | null) ?? [];

            return (
              <Card key={shipment.shipment_id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{shipment.buyer_name}</CardTitle>
                    <p className="text-xs text-muted-foreground">Pedido de {formatDate(shipment.created_at)}</p>
                  </div>
                  <Badge variant={status.variant} className="flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5" />
                    {status.label}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-cc-cream/50">
                          {item.image_url ? (
                            <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="44px" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-5 w-5 text-cc-sand" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-cc-green">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity}x {formatPrice(item.unit_price_cents)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {address ? (
                    <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
                      <p className="flex items-center gap-1 text-xs font-medium text-cc-green">
                        <MapPin className="h-3.5 w-3.5" /> Enviar para
                      </p>
                      <p className="text-foreground/80">
                        {address.street}, {address.number}
                        {address.complement ? `, ${address.complement}` : ""}
                        {address.neighborhood ? ` — ${address.neighborhood}` : ""}
                      </p>
                      <p className="text-foreground/80">
                        {address.city} - {address.state} · CEP {address.cep}
                      </p>
                    </div>
                  ) : null}

                  {shipment.status === "preparing" ? (
                    <form action={markShipmentCollected} className="border-t border-border pt-3">
                      <input type="hidden" name="shipment_id" value={shipment.shipment_id} />
                      <Button type="submit" className="w-full">
                        <Package className="mr-2 h-4 w-4" />
                        Marcar como coletado pela transportadora
                      </Button>
                    </form>
                  ) : shipment.status === "collected" ? (
                    <form action={markShipmentShipped} className="space-y-3 border-t border-border pt-3">
                      <input type="hidden" name="shipment_id" value={shipment.shipment_id} />
                      <p className="text-xs text-muted-foreground">
                        Coletado em {formatDate(shipment.collected_at)}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor={`carrier-${shipment.shipment_id}`}>Transportadora</Label>
                          <Input
                            id={`carrier-${shipment.shipment_id}`}
                            name="carrier"
                            placeholder="Ex: Correios (PAC), Jadlog"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`tracking-${shipment.shipment_id}`}>Código de rastreio</Label>
                          <Input
                            id={`tracking-${shipment.shipment_id}`}
                            name="tracking_code"
                            placeholder="Ex: AA123456789BR"
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full">
                        <Truck className="mr-2 h-4 w-4" />
                        Marcar como em transporte
                      </Button>
                    </form>
                  ) : shipment.status === "shipped" ? (
                    <div className="space-y-3 border-t border-border pt-3">
                      <div className="text-sm">
                        <p className="text-muted-foreground">
                          {shipment.carrier ? `${shipment.carrier} · ` : ""}
                          {shipment.tracking_code ? (
                            <span className="font-medium text-cc-green">{shipment.tracking_code}</span>
                          ) : (
                            "sem código de rastreio"
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">Enviado em {formatDate(shipment.shipped_at)}</p>
                      </div>
                      <form action={markShipmentDelivered}>
                        <input type="hidden" name="shipment_id" value={shipment.shipment_id} />
                        <Button type="submit" variant="outline" className="w-full">
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Marcar como entregue
                        </Button>
                      </form>
                    </div>
                  ) : shipment.status === "delivered" ? (
                    <p className="flex items-center gap-1 border-t border-border pt-3 text-sm text-cc-green">
                      <CheckCircle2 className="h-4 w-4" />
                      Entregue em {formatDate(shipment.delivered_at)}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
