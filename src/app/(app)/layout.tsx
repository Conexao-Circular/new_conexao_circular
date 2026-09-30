import { redirect } from "next/navigation";
import { Leaf, Recycle, Settings, Sparkles, User } from "lucide-react";
import { BottomNav, type NavItem } from "@/components/bottom-nav";
import { PwaRegister } from "@/components/pwa-register";
import { LogoMark } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { NavHomeIcon, NavMapIcon, NavStoreIcon } from "@/components/nav-icons";
import { createClient } from "@/lib/supabase/server";

const ICON_CLASS = "h-5 w-5";
const TRIAL_DAYS = 7;

function isTrialActive(approvedAt: string | null) {
  if (!approvedAt) return false;
  const trialEndsAt = new Date(approvedAt).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() < trialEndsAt;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  consumidor: [
    { href: "/", label: "Mapa", icon: <NavMapIcon className={ICON_CLASS} /> },
    { href: "/inicio", label: "Início", icon: <NavHomeIcon className={ICON_CLASS} /> },
    { href: "/loja", label: "Loja", icon: <NavStoreIcon className={ICON_CLASS} /> },
    { href: "/pontos", label: "Pontos", icon: <Sparkles className={ICON_CLASS} /> },
    { href: "/impacto", label: "Impacto", icon: <Leaf className={ICON_CLASS} /> },
    { href: "/perfil", label: "Perfil", icon: <User className={ICON_CLASS} /> },
  ],
  produtor: [
    { href: "/", label: "Mapa", icon: <NavMapIcon className={ICON_CLASS} /> },
    { href: "/inicio", label: "Início", icon: <NavHomeIcon className={ICON_CLASS} /> },
    { href: "/loja", label: "Loja", icon: <NavStoreIcon className={ICON_CLASS} /> },
    { href: "/coletas", label: "Coleta", icon: <Recycle className={ICON_CLASS} /> },
    { href: "/pontos", label: "Pontos", icon: <Sparkles className={ICON_CLASS} /> },
    { href: "/perfil", label: "Perfil", icon: <User className={ICON_CLASS} /> },
  ],
  cooperativa: [
    { href: "/", label: "Mapa", icon: <NavMapIcon className={ICON_CLASS} /> },
    { href: "/inicio", label: "Início", icon: <NavHomeIcon className={ICON_CLASS} /> },
    { href: "/loja", label: "Loja", icon: <NavStoreIcon className={ICON_CLASS} /> },
    { href: "/coletas", label: "Coletas", icon: <Recycle className={ICON_CLASS} /> },
    { href: "/impacto", label: "Impacto", icon: <Leaf className={ICON_CLASS} /> },
    { href: "/perfil", label: "Perfil", icon: <User className={ICON_CLASS} /> },
  ],
  admin: [
    { href: "/", label: "Mapa", icon: <NavMapIcon className={ICON_CLASS} /> },
    { href: "/inicio", label: "Início", icon: <NavHomeIcon className={ICON_CLASS} /> },
    { href: "/loja", label: "Loja", icon: <NavStoreIcon className={ICON_CLASS} /> },
    { href: "/coletas", label: "Coletas", icon: <Recycle className={ICON_CLASS} /> },
    { href: "/admin", label: "Admin", icon: <Settings className={ICON_CLASS} /> },
    { href: "/perfil", label: "Perfil", icon: <User className={ICON_CLASS} /> },
  ],
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, approval_status, approved_at, access_override")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "admin" && !profile.access_override) {
    if (profile.approval_status !== "approved") {
      redirect("/aguardando-aprovacao");
    }

    if (!isTrialActive(profile.approved_at)) {
      const { data: activeSubscription } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("profile_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!activeSubscription) {
        redirect("/onboarding/plano?expirado=1");
      }
    }

    // Produtor Circular (produtor/cooperativa) needs curation approval before
    // touching the marketplace/coletas — account approval above only means
    // "not spam", not "vetted business".
    if (profile.role === "produtor" || profile.role === "cooperativa") {
      const { data: application } = await supabase
        .from("producer_applications")
        .select("status")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (application?.status !== "approved") {
        redirect("/onboarding/parceiro");
      }
    }
  }

  const navItems = NAV_BY_ROLE[profile.role] ?? NAV_BY_ROLE.consumidor;

  return (
    <div className="app-shell min-h-svh w-full pb-20">
      <header className="app-topbar sticky top-0 z-30 flex items-center gap-2 px-4 py-2.5 backdrop-blur">
        <LogoMark className="h-6 w-6" />
        <span className="font-heading text-lg font-semibold text-cc-green">Conexão Circular</span>
      </header>
      {children}
      <SiteFooter />
      <PwaRegister />
      <BottomNav items={navItems} />
    </div>
  );
}
