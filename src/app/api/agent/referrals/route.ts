import { NextResponse } from "next/server";
import { getAuthenticatedAgent } from "@/lib/agent-auth";
import { recordAgentEvent } from "@/lib/agent-analytics";

const TYPES = ["business", "cooperative", "organic_solution"] as const;

export async function GET() {
  const agent = await getAuthenticatedAgent();
  if (!agent) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const { data, error } = await agent.supabase.from("agent_referrals").select("*").eq("agent_id", agent.user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Não foi possível carregar as indicações." }, { status: 500 });
  return NextResponse.json({ referrals: data ?? [] });
}

export async function POST(request: Request) {
  const agent = await getAuthenticatedAgent();
  if (!agent) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const referralType = typeof body?.referral_type === "string" ? body.referral_type : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!TYPES.includes(referralType as (typeof TYPES)[number]) || name.length < 2) return NextResponse.json({ error: "Informe o tipo e o nome da indicação." }, { status: 400 });
  const payload = {
    agent_id: agent.user.id,
    referral_type: referralType,
    name: name.slice(0, 160),
    responsible_name: typeof body?.responsible_name === "string" ? body.responsible_name.trim().slice(0, 160) : null,
    contact: typeof body?.contact === "string" ? body.contact.trim().slice(0, 160) : null,
    neighborhood: typeof body?.neighborhood === "string" ? body.neighborhood.trim().slice(0, 120) : null,
    city: typeof body?.city === "string" ? body.city.trim().slice(0, 120) : null,
    reason: typeof body?.reason === "string" ? body.reason.trim().slice(0, 1000) : null,
    observed_practice: typeof body?.observed_practice === "string" ? body.observed_practice.trim().slice(0, 1000) : null,
    status: "indicated",
    source: "agent_panel",
  };
  const { data, error } = await agent.supabase.from("agent_referrals").insert(payload).select().single();
  if (error) return NextResponse.json({ error: "Não foi possível salvar a indicação." }, { status: 500 });
  await recordAgentEvent(agent.supabase, agent.user.id, "referral_created", { referral_type: referralType });
  return NextResponse.json({ referral: data }, { status: 201 });
}
