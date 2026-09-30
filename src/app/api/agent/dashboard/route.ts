import { NextResponse } from "next/server";
import { getAuthenticatedAgent } from "@/lib/agent-auth";

export async function GET() {
  const agent = await getAuthenticatedAgent();
  if (!agent) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const [{ count: referrals }, { count: evidences }, { data: progress }] = await Promise.all([
    agent.supabase.from("agent_referrals").select("id", { count: "exact", head: true }).eq("agent_id", agent.user.id),
    agent.supabase.from("agent_evidences").select("id", { count: "exact", head: true }).eq("agent_id", agent.user.id),
    agent.supabase.from("agent_course_progress").select("course_slug, quiz_passed, status").eq("agent_id", agent.user.id),
  ]);
  return NextResponse.json({ profile: agent.profile, counts: { referrals: referrals ?? 0, evidences: evidences ?? 0, completed_modules: (progress ?? []).filter((row) => row.quiz_passed || row.status === "completed").length } });
}
