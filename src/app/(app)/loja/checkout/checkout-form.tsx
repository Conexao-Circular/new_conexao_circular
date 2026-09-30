"use client";

import Image from "next/image";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { CreditCard, Loader2, Package, QrCode, Sparkles, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { benefitsForPoints, levelDiscountCents } from "@/lib/gamification";
import { createOrderFromCart } from "./actions";

type CartItem = {
  product_id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    price_cents: number;
    points_value: number;
    image_url: string | null;
  };
};

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

const PAYMENT_METHODS = [
  {
    id: "pix",
    label: "PIX",
    sublabel: "Aprovação imediata",
    icon: <QrCode className="h-5 w-5" />,
  },
  {
    id: "credit_card",
    label: "Cartão",
    sublabel: "Em até 6x sem juros",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: "boleto",
    label: "Boleto",
    sublabel: "Vence em 3 dias úteis",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="6" y1="9" x2="6" y2="15" />
        <line x1="8" y1="9" x2="8" y2="15" />
        <line x1="10" y1="9" x2="10" y2="12" />
        <line x1="12" y1="9" x2="12" y2="15" />
        <line x1="14" y1="9" x2="14" y2="12" />
        <line x1="16" y1="9" x2="16" y2="15" />
        <line x1="18" y1="9" x2="18" y2="15" />
      </svg>
    ),
  },
] as const;

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processando…
        </>
      ) : (
        "Confirmar pedido"
      )}
    </Button>
  );
}

function formatCpf(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function CheckoutForm({
  items,
  error,
  cashbackCents = 0,
  defaultCpf = "",
  levelName,
  lifetimePoints = 0,
}: {
  items: CartItem[];
  error?: string;
  cashbackCents?: number;
  defaultCpf?: string;
  levelName?: string;
  lifetimePoints?: number;
}) {
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit_card" | "boleto">("pix");
  const [cpf, setCpf] = useState(formatCpf(defaultCpf));
  const [useCashback, setUseCashback] = useState(false);
  const [cep, setCep] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [street, setStreet] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const subtotal = items.reduce((sum, i) => sum + i.products.price_cents * i.quantity, 0);
  const totalPoints = items.reduce((sum, i) => sum + i.products.points_value * i.quantity, 0);
  // Espelha a ordem aplicada em create_order_from_cart: o desconto de nível sai
  // do subtotal e o cashback abate o que sobrou.
  const benefits = benefitsForPoints(lifetimePoints);
  const levelDiscount = levelDiscountCents(subtotal, lifetimePoints);
  const afterLevel = subtotal - levelDiscount;
  const cashbackDiscount = useCashback ? Math.min(cashbackCents, afterLevel) : 0;
  const total = afterLevel - cashbackDiscount;

  async function handleCepBlur() {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setStreet(data.logradouro ?? "");
        setNeighborhood(data.bairro ?? "");
        setCity(data.localidade ?? "");
        setState(data.uf ?? "");
      }
    } catch {
      /* ignore */
    } finally {
      setCepLoading(false);
    }
  }

  function formatCep(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return digits;
  }

  return (
    <form action={createOrderFromCart} className="space-y-6">
      <input type="hidden" name="payment_method" value={paymentMethod} />
      <input type="hidden" name="use_cashback" value={useCashback ? "1" : "0"} />

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Order summary */}
      <Card className="checkout-summary-card">
        <CardHeader>
          <CardTitle>Resumo do pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div key={item.product_id} className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cc-cream/50">
                {item.products.image_url ? (
                  <Image
                    src={item.products.image_url}
                    alt={item.products.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-5 w-5 text-cc-sand" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-cc-green">{item.products.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity}x {formatPrice(item.products.price_cents)}
                </p>
              </div>
              <p className="text-sm font-semibold text-cc-green">
                {formatPrice(item.products.price_cents * item.quantity)}
              </p>
            </div>
          ))}

          <div className="space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {levelDiscount > 0 ? (
              <div className="flex justify-between text-cc-green">
                <span>
                  Desconto {levelName ?? "do seu nível"} ({benefits.discountPercent}%)
                </span>
                <span>-{formatPrice(levelDiscount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-muted-foreground">
              <span>Frete</span>
              {benefits.freeShipping ? (
                <span className="flex items-center gap-1 font-medium text-cc-green">
                  <Truck className="h-3.5 w-3.5" />
                  Grátis
                </span>
              ) : (
                <span className="text-cc-orange">Calculado no pagamento</span>
              )}
            </div>
            {cashbackDiscount > 0 ? (
              <div className="flex justify-between text-cc-green">
                <span>Cashback aplicado</span>
                <span>-{formatPrice(cashbackDiscount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between pt-1 font-semibold text-cc-green">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            {totalPoints > 0 ? (
              <p className="flex items-center gap-1 pt-1 text-xs text-cc-orange">
                <Sparkles className="h-3.5 w-3.5" />
                +{totalPoints} pontos ao confirmar o pagamento
              </p>
            ) : null}
          </div>

          {cashbackCents > 0 ? (
            <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-cc-green/20 bg-cc-green/5 p-3">
              <span className="text-sm text-cc-green">
                Usar meu cashback
                <span className="block text-xs text-cc-green/70">
                  Saldo disponível: {formatPrice(cashbackCents)}
                </span>
              </span>
              <input
                type="checkbox"
                checked={useCashback}
                onChange={(event) => setUseCashback(event.target.checked)}
                className="h-5 w-5 accent-cc-green"
              />
            </label>
          ) : null}
        </CardContent>
      </Card>

      {/* Delivery address */}
      <Card className="checkout-address-card">
        <CardHeader>
          <CardTitle>Endereço de entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <div className="relative">
              <Input
                id="cep"
                name="cep"
                placeholder="00000-000"
                value={cep}
                onChange={(e) => setCep(formatCep(e.target.value))}
                onBlur={handleCepBlur}
                maxLength={9}
                required
              />
              {cepLoading ? (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Rua / Avenida</Label>
            <Input
              id="street"
              name="street"
              placeholder="Ex: Rua das Flores"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input id="number" name="number" placeholder="123" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input id="complement" name="complement" placeholder="Apto, bloco…" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              name="neighborhood"
              placeholder="Centro"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                name="city"
                placeholder="São Paulo"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">UF</Label>
              <Input
                id="state"
                name="state"
                placeholder="SP"
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment method */}
      <Card className="checkout-payment-card">
        <CardHeader>
          <CardTitle>Forma de pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF do pagador</Label>
            <Input
              id="cpf"
              name="cpf"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
              maxLength={14}
              required
            />
            <p className="text-xs text-muted-foreground">Necessário para emitir a cobrança (Pix, boleto ou cartão).</p>
          </div>

          <div role="radiogroup" aria-label="Forma de pagamento" className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                type="button"
                role="radio"
                aria-checked={paymentMethod === method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-colors ${
                  paymentMethod === method.id
                    ? "border-cc-green bg-cc-green/5 text-cc-green"
                    : "border-border text-muted-foreground hover:border-cc-green/40"
                }`}
              >
                {method.icon}
                <span className="text-xs font-semibold leading-none">{method.label}</span>
                <span className="text-[10px] leading-tight opacity-70">{method.sublabel}</span>
              </button>
            ))}
          </div>

          {/* PIX details */}
          {paymentMethod === "pix" ? (
            <div className="rounded-xl border border-cc-green/20 bg-cc-green/5 p-4 text-sm text-cc-green">
              <p className="font-medium">Como funciona o PIX</p>
              <ul className="mt-2 space-y-1 text-xs text-cc-green/80">
                <li>1. Confirme o pedido</li>
                <li>2. Você receberá a chave PIX gerada pelo sistema de pagamento</li>
                <li>3. Pague pelo seu banco em até 30 minutos</li>
                <li>4. Aprovação imediata após o pagamento</li>
              </ul>
            </div>
          ) : null}

          {/* Credit card form */}
          {paymentMethod === "credit_card" ? (
            <div className="space-y-3 rounded-xl border border-border p-4">
              <p className="text-xs font-medium text-muted-foreground">Dados do cartão</p>
              <div className="space-y-2">
                <Label htmlFor="card_number">Número do cartão</Label>
                <Input id="card_number" placeholder="0000 0000 0000 0000" maxLength={19} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card_name">Nome no cartão</Label>
                <Input id="card_name" placeholder="Como está impresso" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="card_expiry">Validade</Label>
                  <Input id="card_expiry" placeholder="MM/AA" maxLength={5} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="card_cvv">CVV</Label>
                  <Input id="card_cvv" placeholder="123" maxLength={4} type="password" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                🔒 Dados processados pelo gateway de pagamento. Não armazenamos informações do cartão.
              </p>
            </div>
          ) : null}

          {/* Boleto details */}
          {paymentMethod === "boleto" ? (
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <p className="font-medium text-cc-green">Como funciona o boleto</p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>1. Confirme o pedido</li>
                <li>2. O boleto será gerado e enviado por e-mail</li>
                <li>3. Pague em qualquer banco ou lotérica</li>
                <li>4. Aprovação em até 3 dias úteis após o pagamento</li>
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <ConfirmButton />
    </form>
  );
}
