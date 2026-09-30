import { NextResponse } from "next/server";
import { getAuthenticatedAgent } from "@/lib/agent-auth";
import { recordAgentEvent } from "@/lib/agent-analytics";

export async function GET() {
  const agent = await getAuthenticatedAgent();
  if (!agent) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  return NextResponse.json({
    mission: agent.profile.agent_practical_mission,
    status: agent.profile.agent_practical_mission_status,
    feedback: agent.profile.agent_practical_mission_feedback,
  });
}

export async function POST(request: Request) {
  const agent = await getAuthenticatedAgent();
  if (!agent) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  if (!["evaluation_pending", "approved", "active"].includes(agent.profile.agent_status ?? "")) {
    return NextResponse.json({ error: "Conclua os seis módulos e os quizzes antes da missão prática." }, { status: 409 });
  }
  if (["submitted", "approved"].includes(agent.profile.agent_practical_mission_status ?? "")) {
    return NextResponse.json({ error: "A missão prática já foi enviada e não pode ser duplicada." }, { status: 409 });
  }
  const body = await request.json().catch(() => null) as { title?: string; description?: string } | null;
  const title = body?.title?.trim() ?? "";
  const description = body?.description?.trim() ?? "";
  if (title.length < 3 || description.length < 20) return NextResponse.json({ error: "Descreva uma missão objetiva com pelo menos 20 caracteres." }, { status: 400 });

  const mission = JSON.stringify({ title: title.slice(0, 120), description: description.slice(0, 2000), submitted_at: new Date().toISOString() });
  const { error } = await agent.supabase.from("profiles").update({
    agent_practical_mission: mission,
    agent_practical_mission_status: "submitted",
    agent_status: "evaluation_pending",
    agent_practical_mission_feedback: null,
  }).eq("id", agent.user.id);
  if (error) return NextResponse.json({ error: "Não foi possível enviar a missão." }, { status: 500 });
  await recordAgentEvent(agent.supabase, agent.user.id, "practical_mission_submitted");
  return NextResponse.json({ status: "submitted", mission: JSON.parse(mission) });
}
