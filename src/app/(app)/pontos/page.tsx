import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Flame,
  Gift,
  Lock,
  Medal,
  Recycle,
  Scale,
  ShoppingBag,
  Sparkles,
  Sprout,
  Ticket,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/auth-shell";
import { ReferralCard } from "@/components/referral-card";
import { createClient } from "@/lib/supabase/server";
import { LEVELS, computeLevel, describeBenefits } from "@/lib/gamification";
import { redeemItem } from "./actions";

const SOURCE_LABELS: Record<string, string> = {
  collection: "Coleta confirmada",
  purchase: "Compra na loja",
  referral: "Indicação",
  challenge: "Desafio",
  manual: "Ajuste manual",
  redemption: "Resgate de benefício",
};

const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  sprout: Sprout,
  recycle: Recycle,
  scale: Scale,
  flame: Flame,
  "shopping-bag": ShoppingBag,
  gift: Gift,
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function PontosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; resgatado?: string }>;
}) {
  const { error, resgatado } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, points_balance, lifetime_points, streak_weeks, referral_code")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  if (profile.role !== "consumidor" && profile.role !== "produtor") {
    return (
      <div className="internal-page points-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <header>
          <h1 className="font-heading text-2xl font-semibold text-cc-green">Pontos</h1>
        </header>
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            O sistema de pontos é exclusivo para consumidores e produtores.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [{ data: achievements }, { data: earned }, { data: rewards }, { data: redemptions }, { data: transactions }] =
    await Promise.all([
      supabase.from("achievements").select("code, name, description, icon, sort_order").order("sort_order"),
      supabase.from("user_achievements").select("achievement_code, earned_at").eq("profile_id", user.id),
      supabase
        .from("partner_items")
        .select("id, name, description, points_cost, partners!inner(name, status)")
        .gt("points_cost", 0)
        .eq("partners.status", "active")
        .order("points_cost", { ascending: true }),
      supabase
        .from("redemptions")
        .select("id, code, created_at, partner_items(name)")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("point_transactions")
        .select("id, source_type, points, description, created_at")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const level = computeLevel(profile.lifetime_points);
  const earnedCodes = new Set((earned ?? []).map((e) => e.achievement_code));
  const earnedCount = earnedCodes.size;
  const totalAchievements = achievements?.length ?? 0;

  return (
    <div className="internal-page points-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-5 px-4 py-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold text-cc-green">Recompensas</h1>
        <p className="text-sm text-muted-foreground">Seu nível, conquistas e pontos.</p>
      </header>

      <FormError message={error} />

      {resgatado ? (
        <div className="flex items-start gap-3 rounded-xl border border-cc-green/30 bg-cc-green/8 px-4 py-3 text-sm text-cc-green">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Resgate concluído!</p>
            <p className="text-cc-green/80">
              Apresente o código <span className="font-mono font-semibold">{resgatado}</span> no parceiro.
            </p>
          </div>
        </div>
      ) : null}

      {/* Level + progress */}
      <div className="points-level rounded-2xl bg-gradient-to-br from-cc-green to-[#2a3529] p-5 text-cc-paper shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-cc-paper/60">Nível</p>
            <p className="font-heading text-3xl font-semibold">{level.current.name}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {profile.streak_weeks > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-cc-orange/90 px-2.5 py-1 text-xs font-semibold">
                <Flame className="h-3.5 w-3.5" />
                {profile.streak_weeks} sem.
              </span>
            )}
            <span className="text-xs text-cc-paper/60">{profile.lifetime_points} pts totais</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-cc-paper/15">
            <div
              className="h-full rounded-full bg-cc-orange transition-all"
              style={{ width: `${Math.round(level.progress * 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-cc-paper/70">
            {level.next
              ? `Faltam ${level.pointsForNext} pts para ${level.next.name}`
              : "Nível máximo alcançado! 🌳"}
          </p>
        </div>
      </div>

      {/* Benefit club */}
      <Card className="points-benefits-card">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <Medal className="h-5 w-5 text-cc-orange" />
          <CardTitle>Clube de Benefícios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {LEVELS.map((item) => {
            const unlocked = item.index <= level.current.index;
            const benefits = describeBenefits(item.benefits);
            return (
              <div
                key={item.index}
                className={`rounded-lg border p-3 text-sm ${
                  item.index === level.current.index
                    ? "border-cc-orange bg-cc-orange/5"
                    : unlocked
                      ? "border-cc-green/25 bg-cc-green/5"
                      : "border-border bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-medium ${unlocked ? "text-cc-green" : "text-muted-foreground"}`}>
                    {item.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.min === 0 ? "desde o início" : `${item.min} pts`}
                  </span>
                </div>
                {benefits.length > 0 ? (
                  <ul className={`mt-1.5 space-y-1 text-xs ${unlocked ? "text-foreground/80" : "text-muted-foreground"}`}>
                    {benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-1.5">
                        {unlocked ? (
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cc-green" />
                        ) : (
                          <Lock className="mt-0.5 h-3 w-3 shrink-0" />
                        )}
                        {benefit}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Ponto de partida: acumule pontos para destravar os benefícios.
                  </p>
                )}
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground">
            O nível vem dos pontos acumulados na sua conta — resgatar não faz você descer de nível.
          </p>
        </CardContent>
      </Card>

      {/* Spendable balance */}
      <Card className="points-balance-card">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cc-orange" />
            <span className="text-sm text-muted-foreground">Saldo para resgatar</span>
          </div>
          <span className="text-2xl font-semibold text-cc-orange">{profile.points_balance} pts</span>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="points-achievements-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-cc-orange" />
            Conquistas
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {earnedCount}/{totalAchievements}
          </span>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {(achievements ?? []).map((achievement) => {
              const Icon = ACHIEVEMENT_ICONS[achievement.icon] ?? Trophy;
              const unlocked = earnedCodes.has(achievement.code);
              return (
                <div
                  key={achievement.code}
                  title={achievement.description}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ${
                    unlocked
                      ? "border-cc-green/25 bg-cc-green/5"
                      : "border-border bg-muted/30 opacity-60"
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full ${
                      unlocked ? "bg-cc-green/15 text-cc-green" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {unlocked ? <Icon className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                  </div>
                  <span className="text-[11px] font-medium leading-tight text-cc-green">
                    {achievement.name}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Referral */}
      {profile.referral_code ? <ReferralCard code={profile.referral_code} /> : null}

      {/* Redeem */}
      <Card className="points-redeem-card">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <Gift className="h-5 w-5 text-cc-green" />
          <CardTitle>Resgatar com pontos</CardTitle>
        </CardHeader>
        <CardContent className="points-redeem-content space-y-3">
          {rewards && rewards.length > 0 ? (
            rewards.map((item) => {
              const affordable = profile.points_balance >= item.points_cost;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-cc-green">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.partners?.name}
                      {item.description ? ` · ${item.description}` : ""}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-cc-orange">{item.points_cost} pts</p>
                  </div>
                  <form action={redeemItem}>
                    <input type="hidden" name="item_id" value={item.id} />
                    <Button type="submit" size="sm" disabled={!affordable}>
                      {affordable ? "Resgatar" : "Faltam pontos"}
                    </Button>
                  </form>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum benefício disponível para resgate no momento.</p>
          )}
        </CardContent>
      </Card>

      {/* Redemptions */}
      {redemptions && redemptions.length > 0 ? (
        <Card className="points-redemptions-card">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0">
            <Ticket className="h-5 w-5 text-cc-green" />
            <CardTitle>Meus resgates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {redemptions.map((redemption) => (
              <div
                key={redemption.id}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-cc-green">{redemption.partner_items?.name ?? "Benefício"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(redemption.created_at)}</p>
                </div>
                <span className="font-mono text-sm font-semibold text-cc-orange">{redemption.code}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* History */}
      <Card className="points-history-card">
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {transactions && transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-cc-green">
                    {SOURCE_LABELS[transaction.source_type] ?? transaction.source_type}
                  </p>
                  {transaction.description ? (
                    <p className="text-muted-foreground">{transaction.description}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">{formatDate(transaction.created_at)}</p>
                </div>
                <Badge variant={transaction.points >= 0 ? "default" : "destructive"}>
                  {transaction.points >= 0 ? "+" : ""}
                  {transaction.points}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Você ainda não possui movimentações de pontos.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
