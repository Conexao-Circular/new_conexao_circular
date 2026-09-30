import { NextResponse } from "next/server";
import { getAuthenticatedAgent } from "@/lib/agent-auth";

export async function GET() {
  const agent = await getAuthenticatedAgent();
  if (!agent) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  return NextResponse.json({ profile: agent.profile });
}

export async function PATCH(request: Request) {
  const agent = await getAuthenticatedAgent();
  if (!agent) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const interests = Array.isArray(body?.agent_interests)
    ? body.agent_interests.filter((value): value is string => typeof value === "string").slice(0, 8)
    : undefined;
  const update = {
    agent_bio: typeof body?.agent_bio === "string" ? body.agent_bio.trim().slice(0, 1000) : undefined,
    agent_neighborhood: typeof body?.agent_neighborhood === "string" ? body.agent_neighborhood.trim().slice(0, 120) : undefined,
    agent_city: typeof body?.agent_city === "string" ? body.agent_city.trim().slice(0, 120) : undefined,
    agent_is_available: typeof body?.agent_is_available === "boolean" ? body.agent_is_available : undefined,
    agent_interests: interests,
  };
  const { data, error } = await agent.supabase.from("profiles").update(update).eq("id", agent.user.id).select().single();
  if (error) return NextResponse.json({ error: "Não foi possível atualizar o perfil." }, { status: 500 });
  return NextResponse.json({ profile: data });
}
