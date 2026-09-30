import "server-only";

import { createClient } from "@/lib/supabase/server";
import { AGENT_ROLE, isAgentCircularEnabled } from "@/lib/agent-circular";

export async function getAuthenticatedAgent() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return null;
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAgentCircularEnabled()) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, name, email, phone, role, agent_status, agent_code, agent_slug, agent_is_available, agent_interests, agent_neighborhood, agent_city, agent_bio, agent_course_version, agent_course_score, agent_total_xp, agent_practical_mission, agent_practical_mission_status, agent_practical_mission_feedback, agent_certificate_code, agent_certificate_issued_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile || profile.role !== AGENT_ROLE) return null;
  return { supabase, user, profile };
}

export function agentStateLabel(status: string | null | undefined) {
  return {
    registered: "Cadastro recebido",
    training: "Em formação",
    evaluation_pending: "Aguardando avaliação",
    approved: "Aprovado",
    active: "Ativo",
    inactive: "Inativo",
    suspended: "Suspenso",
    blocked: "Bloqueado",
  }[status ?? ""] ?? "Cadastro recebido";
}
