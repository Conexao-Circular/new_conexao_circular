import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Leaf, Package, ShoppingBag, ShoppingCart, Sparkles, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

const PARTNER_CATEGORY_LABELS: Record<string, string> = {
  restaurante: "Restaurantes",
  hotel: "Hotéis",
  produtor_local: "Produtores locais",
  shopping: "Shoppings",
  servico: "Serviços",
  outro: "Outros",
};

const PARTNER_CATEGORY_ORDER = ["restaurante", "hotel", "produtor_local", "shopping", "servico", "outro"];

const DEMO_PARTNERS = [
  ["Mercado do Bairro", "Mercado", "Icaraí", "🥕", "Escolhas de menor desperdício e produtores locais."],
  ["Hospedagem Mar Aberto", "Hospedagem", "São Francisco", "🌊", "Práticas de redução de descartáveis e experiências locais."],
  ["Oficina Reparo Vivo", "Reparo e reúso", "Centro", "🛠️", "Pequenos reparos para prolongar a vida útil de objetos."],
  ["Brechó Segunda Volta", "Moda circular", "Santa Rosa", "🧥", "Reúso, trocas e circulação de roupas."],
  ["Composta Niterói", "Compostagem", "Fonseca", "🌱", "Informação e soluções locais para resíduos orgânicos."],
  ["Ateliê Feito de Novo", "Artesanato", "Piratininga", "🎨", "Peças autorais feitas com materiais recuperados."],
  ["Coleta Orgânica Itaipu", "Parceiro Circular", "Itaipu", "🌿", "Conexão entre geradores e soluções de compostagem."],
  ["Cooperativa Rede Verde", "Cooperativa", "Centro", "♻️", "Recicláveis secos, trabalho e renda para a cadeia da reciclagem."],
] as const;

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export default async function LojaPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; aba?: string }>;
}) {
  const { categoria, aba } = await searchParams;
  const showPartners = aba === "parceiros";
  const showProducers = aba === "produtores";

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

  const { count: cartCount } = await supabase
    .from("cart_items")
    .select("product_id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (!subscription) {
    redirect("/onboarding/plano");
  }

  if (subscription.status !== "active") {
    return (
      <div className="marketplace-shell marketplace-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
        <header className="marketplace-heading">
          <h1 className="font-heading text-2xl font-semibold text-cc-green">Loja</h1>
          <p className="text-sm text-muted-foreground">Marketplace de produtos sustentáveis.</p>
        </header>

        <Card className="marketplace-notice">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <ShoppingBag className="h-5 w-5 text-cc-green" />
            <CardTitle>Assinatura aguardando ativação</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            A loja é exclusiva para assinantes com plano ativo. Assim que sua assinatura for ativada, você poderá
            comprar produtos e acumular pontos. Acompanhe o status no seu{" "}
            <Link href="/perfil" className="font-medium text-cc-orange">
              perfil
            </Link>
            .
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = (
    <div className="flex gap-2">
      <Link href="/loja">
        <Badge variant={!showPartners && !showProducers ? "default" : "secondary"}>Produtos</Badge>
      </Link>
      <Link href="/loja?aba=parceiros">
        <Badge variant={showPartners ? "default" : "secondary"}>Parceiros</Badge>
      </Link>
      <Link href="/loja?aba=produtores">
        <Badge variant={showProducers ? "default" : "secondary"}>Produtores</Badge>
      </Link>
    </div>
  );

  if (showProducers) {
    const { data: producers } = await supabase.rpc("get_producer_stores");

    return (
      <div className="marketplace-shell marketplace-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
        <header className="marketplace-heading marketplace-site-header flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-cc-green">Loja</h1>
            <p className="text-sm text-muted-foreground">Conheça os produtores da rede Conexão Circular.</p>
          </div>
          <div className="marketplace-header-actions flex items-center gap-3">
            <Link href="/loja/carrinho" className="relative inline-flex items-center gap-1 text-sm font-medium text-cc-green">
              <ShoppingCart className="h-5 w-5" />
              {(cartCount ?? 0) > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cc-orange text-[10px] font-bold text-white">
                  {(cartCount ?? 0) > 9 ? "9+" : cartCount}
                </span>
              ) : null}
            </Link>
            <Link href="/loja/pedidos" className="text-sm font-medium text-cc-orange">
              Pedidos
            </Link>
          </div>
        </header>

        <nav className="marketplace-tabs marketplace-site-nav" aria-label="Seções da loja">{tabs}</nav>

        {producers && producers.length > 0 ? (
          <div className="marketplace-grid grid gap-5 sm:grid-cols-2">
            {producers.map((producer) => (
              <Link key={producer.id} href={`/loja/produtores/${producer.id}`}>
                <Card className="marketplace-card h-full transition-colors hover:border-cc-orange">
                  <div className="marketplace-card-media relative flex h-32 w-full items-center justify-center overflow-hidden rounded-t-xl bg-cc-cream/50">
                    {producer.store_image_url ? (
                      <Image
                        src={producer.store_image_url}
                        alt={producer.store_name ?? producer.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    ) : (
                      <Store className="h-8 w-8 text-cc-sand" />
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle>{producer.store_name ?? producer.name}</CardTitle>
                  </CardHeader>
                  {producer.store_description ? (
                    <CardContent className="line-clamp-2 text-sm text-foreground/80">
                      {producer.store_description}
                    </CardContent>
                  ) : null}
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              <Store className="mx-auto mb-2 h-6 w-6 text-cc-sand" />
              Nenhum produtor com anúncios publicados no momento.
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (showPartners) {
    const { data: partners } = await supabase
      .from("partners")
      .select("id, name, category, address, seal, partner_items(id, name, price_cents, icon, sort_order)")
      .eq("status", "active")
      .order("name")
      .order("sort_order", { referencedTable: "partner_items" });

    const grouped = PARTNER_CATEGORY_ORDER.map((category) => ({
      category,
      partners: (partners ?? []).filter((p) => p.category === category),
    })).filter((group) => group.partners.length > 0);

    return (
      <div className="marketplace-shell marketplace-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
        <header className="marketplace-heading marketplace-site-header flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-cc-green">Loja</h1>
            <p className="text-sm text-muted-foreground">Conheça os parceiros da rede Conexão Circular.</p>
          </div>
          <div className="marketplace-header-actions flex items-center gap-3">
            <Link href="/loja/carrinho" className="relative inline-flex items-center gap-1 text-sm font-medium text-cc-green">
              <ShoppingCart className="h-5 w-5" />
              {(cartCount ?? 0) > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cc-orange text-[10px] font-bold text-white">
                  {(cartCount ?? 0) > 9 ? "9+" : cartCount}
                </span>
              ) : null}
            </Link>
            <Link href="/loja/pedidos" className="text-sm font-medium text-cc-orange">
              Pedidos
            </Link>
          </div>
        </header>

        <nav className="marketplace-tabs marketplace-site-nav" aria-label="Seções da loja">{tabs}</nav>

        <section className="marketplace-demo-section" aria-labelledby="demo-profiles-title">
          <div className="marketplace-section-heading">
            <div>
              <span className="marketplace-eyebrow">EXPLORAÇÃO</span>
              <h2 id="demo-profiles-title">Perfis demonstrativos</h2>
            </div>
            <Link href="/" className="marketplace-map-link">Ver no mapa</Link>
          </div>
          <div className="marketplace-demo-grid">
            {DEMO_PARTNERS.map(([name, category, neighborhood, icon, description]) => (
              <Link key={name} href="/" className="marketplace-demo-card">
                <span className="marketplace-demo-icon" aria-hidden="true">{icon}</span>
                <span className="marketplace-demo-copy"><strong>{name}</strong><small>{category} · {neighborhood}</small><em>{description}</em></span>
              </Link>
            ))}
          </div>
        </section>

        {grouped.length > 0 ? (
          grouped.map((group) => (
            <div key={group.category} className="marketplace-category space-y-3">
              <h2 className="font-heading text-lg font-semibold text-cc-green">
                {PARTNER_CATEGORY_LABELS[group.category] ?? group.category}
              </h2>
              <div className="marketplace-grid grid gap-5 sm:grid-cols-2">
                {group.partners.map((partner) => (
                  <Link key={partner.id} href={`/loja/parceiros/${partner.id}`}>
                    <Card className="marketplace-card h-full transition-colors hover:border-cc-orange">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle>{partner.name}</CardTitle>
                          {partner.seal ? (
                            <Badge variant="secondary" className="gap-1 whitespace-nowrap">
                              <Leaf className="h-3 w-3" />
                              Selo
                            </Badge>
                          ) : null}
                        </div>
                        <p className="line-clamp-1 text-xs text-muted-foreground">{partner.address}</p>
                      </CardHeader>
                      {(partner.partner_items ?? []).length > 0 ? (
                        <CardContent className="space-y-2 text-base">
                          {(partner.partner_items ?? []).slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-foreground">
                              <span className="line-clamp-1">
                                {item.icon ? `${item.icon} ` : ""}
                                {item.name}
                              </span>
                              <span className="whitespace-nowrap font-semibold text-cc-green">
                                {formatPrice(item.price_cents)}
                              </span>
                            </div>
                          ))}
                        </CardContent>
                      ) : null}
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              <Leaf className="mx-auto mb-2 h-6 w-6 text-cc-sand" />
              Nenhum parceiro disponível no momento.
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, price_cents, points_value, category, image_url")
    .eq("status", "active")
    .eq("approved", true)
    .order("name");

  const categories = Array.from(new Set((products ?? []).map((p) => p.category).filter(Boolean))) as string[];

  const filtered = categoria
    ? (products ?? []).filter((p) => p.category === categoria)
    : (products ?? []);

  return (
    <div className="marketplace-shell marketplace-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
      <header className="marketplace-heading marketplace-site-header flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-cc-green">Loja</h1>
          <p className="text-sm text-muted-foreground">Produtos sustentáveis de parceiros da rede.</p>
        </div>
        <Link href="/loja/pedidos" className="text-sm font-medium text-cc-orange">
          Meus pedidos
        </Link>
      </header>

      <nav className="marketplace-tabs marketplace-site-nav" aria-label="Seções da loja">{tabs}</nav>

      {categories.length > 0 ? (
        <div className="marketplace-categories flex flex-wrap gap-2">
          <Link href="/loja">
            <Badge variant={!categoria ? "default" : "secondary"}>Todos</Badge>
          </Link>
          {categories.map((category) => (
            <Link key={category} href={`/loja?categoria=${encodeURIComponent(category)}`}>
              <Badge variant={categoria === category ? "default" : "secondary"}>{category}</Badge>
            </Link>
          ))}
        </div>
      ) : null}

      {filtered.length > 0 ? (
        <div className="marketplace-grid grid gap-5 sm:grid-cols-2">
          {filtered.map((product) => (
            <Link key={product.id} href={`/loja/${product.id}`}>
              <Card className="marketplace-card h-full transition-colors hover:border-cc-orange">
                <div className="marketplace-card-media relative flex h-44 w-full items-center justify-center overflow-hidden rounded-t-xl bg-cc-cream/50">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
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
            <Leaf className="mx-auto mb-2 h-6 w-6 text-cc-sand" />
            Nenhum produto disponível nesta categoria no momento.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
