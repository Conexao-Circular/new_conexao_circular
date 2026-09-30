import { redirect } from "next/navigation";
import { Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(app)/inicio/actions";
import { selectPlan } from "./actions";
import type { Database } from "@/lib/supabase/types";

type PlanAudience = Database["public"]["Enums"]["plan_audience"];

const PLAN_AUDIENCE_ROLES: PlanAudience[] = ["consumidor", "produtor", "cooperativa"];

function isPlanAudience(role: string): role is PlanAudience {
  return (PLAN_AUDIENCE_ROLES as string[]).includes(role);
}

function formatPrice(cents: number | null) {
  if (cents === null) return "Sob consulta";
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês`;
}

export default async function EscolhaPlanoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; expirado?: string }>;
}) {
  const { error, expirado } = await searchParams;
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

  if (!profile || !isPlanAudience(profile.role)) {
    redirect("/inicio");
  }

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id, status, plans(name)")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const latestSubscription = subscriptions?.[0];

  if (latestSubscription?.status === "active") {
    redirect("/inicio");
  }

  if (latestSubscription?.status === "pending") {
    const planName =
      latestSubscription.plans && typeof latestSubscription.plans === "object" && "name" in latestSubscription.plans
        ? (latestSubscription.plans as { name: string }).name
        : "escolhido";

    return (
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cc-cream/60">
          <Clock3 className="h-7 w-7 text-cc-green" />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-cc-green">Aguardando confirmação</h1>
        <p className="text-sm text-muted-foreground">
          Você escolheu o plano <strong>{planName}</strong>. Assim que o administrador confirmar o pagamento, seu
          acesso é liberado automaticamente.
        </p>
        <form action={logout} className="w-full">
          <Button type="submit" variant="outline" className="w-full">
            Sair
          </Button>
        </form>
      </div>
    );
  }

  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("audience", profile.role)
    .order("sort_order");

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-8 px-4 py-12">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-semibold text-cc-green">Escolha seu plano</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Você poderá ajustar seu plano depois nas configurações da conta.
        </p>
        {expirado ? (
          <p className="mx-auto mt-4 max-w-md rounded-xl border border-cc-sand/40 bg-cc-cream/60 px-3 py-2 text-sm text-cc-green">
            Seu período gratuito de 7 dias acabou. Escolha um plano para continuar usando a Conexão Circular.
          </p>
        ) : null}
        {error ? (
          <p className="mx-auto mt-4 max-w-md rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(plans ?? []).map((plan) => {
          const benefits = Array.isArray(plan.benefits) ? (plan.benefits as string[]) : [];

          return (
            <Card
              key={plan.id}
              className={
                plan.highlighted
                  ? "border-cc-orange shadow-md ring-1 ring-cc-orange"
                  : undefined
              }
            >
              <CardHeader className="space-y-2">
                {plan.highlighted ? (
                  <Badge className="w-fit bg-cc-orange text-white">Mais popular</Badge>
                ) : null}
                <CardTitle className="font-heading text-xl text-cc-green">{plan.name}</CardTitle>
                <p className="text-2xl font-semibold text-cc-green">{formatPrice(plan.price_cents)}</p>
                {plan.description ? (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                ) : null}
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-cc-green">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-cc-orange" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <form action={selectPlan} className="w-full">
                  <input type="hidden" name="plan_id" value={plan.id} />
                  <Button type="submit" className="w-full" variant={plan.highlighted ? "default" : "outline"}>
                    Escolher {plan.name}
                  </Button>
                </form>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
