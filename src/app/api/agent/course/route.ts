import { NextResponse } from "next/server";
import { AGENT_COURSE_MODULES, AGENT_COURSE_PASSING_SCORE } from "@/lib/agent-course";
import { gradeAgentQuiz } from "@/lib/agent-circular";
import { getAuthenticatedAgent } from "@/lib/agent-auth";
import { recordAgentEvent } from "@/lib/agent-analytics";

export async function GET() {
  const agent = await getAuthenticatedAgent();
  if (!agent) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { data: rows, error } = await agent.supabase
    .from("agent_course_progress")
    .select("course_slug, status, progress_percent, started_at, completed_at, quiz_score, quiz_attempts, quiz_passed, xp_earned")
    .eq("agent_id", agent.user.id);
  if (error) return NextResponse.json({ error: "Não foi possível carregar a formação." }, { status: 500 });

  return NextResponse.json({
    modules: AGENT_COURSE_MODULES,
    passingScore: AGENT_COURSE_PASSING_SCORE,
    progress: rows ?? [],
    profile: agent.profile,
  });
}

export async function POST(request: Request) {
  const agent = await getAuthenticatedAgent();
  if (!agent) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await request.json().catch(() => null) as { moduleId?: string; answers?: Record<string, number> } | null;
  const moduleId = body?.moduleId ?? "";
  let result: ReturnType<typeof gradeAgentQuiz>;
  try {
    result = gradeAgentQuiz(moduleId as never, body?.answers ?? {});
  } catch {
    return NextResponse.json({ error: "Módulo ou respostas inválidas." }, { status: 400 });
  }

  const moduleIndex = AGENT_COURSE_MODULES.findIndex((module) => module.id === moduleId);
  if (moduleIndex < 0) return NextResponse.json({ error: "Módulo inválido." }, { status: 400 });

  const { data: previousRows } = await agent.supabase
    .from("agent_course_progress")
    .select("course_slug, status, quiz_score, quiz_attempts, quiz_passed, xp_earned")
    .eq("agent_id", agent.user.id);
  const previous = previousRows?.find((row) => row.course_slug === moduleId);
  const completed = new Set((previousRows ?? []).filter((row) => row.quiz_passed || row.status === "completed").map((row) => row.course_slug));
  if (moduleIndex > 0 && !completed.has(AGENT_COURSE_MODULES[moduleIndex - 1].id)) {
    return NextResponse.json({ error: "Conclua o módulo anterior antes de continuar." }, { status: 409 });
  }

  if (previous?.quiz_passed) {
    return NextResponse.json({ score: previous.quiz_score ?? 100, passed: true, alreadyCompleted: true, xp: previous.xp_earned ?? 0 });
  }

  const passed = result.score >= AGENT_COURSE_PASSING_SCORE;
  const xp = passed ? 70 : 0;
  const nextAttempts = (previous?.quiz_attempts ?? 0) + 1;
  const { error: saveError } = await agent.supabase.from("agent_course_progress").upsert({
    agent_id: agent.user.id,
    course_slug: moduleId,
    status: passed ? "completed" : "in_progress",
    progress_percent: result.score,
    started_at: previous ? undefined : new Date().toISOString(),
    completed_at: passed ? new Date().toISOString() : null,
    quiz_score: result.score,
    quiz_attempts: nextAttempts,
    quiz_passed: passed,
    xp_earned: xp,
  }, { onConflict: "agent_id,course_slug" });
  if (saveError) return NextResponse.json({ error: "Não foi possível salvar seu resultado." }, { status: 500 });

  const nextCompleted = passed ? new Set([...completed, moduleId]) : completed;
  const allComplete = AGENT_COURSE_MODULES.every((module) => nextCompleted.has(module.id));
  const { error: profileError } = await agent.supabase.from("profiles").update({
    agent_status: allComplete ? "evaluation_pending" : "training",
    agent_course_score: result.score,
    agent_total_xp: (agent.profile.agent_total_xp ?? 0) + xp,
  }).eq("id", agent.user.id);
  if (profileError) return NextResponse.json({ error: "Resultado salvo, mas o perfil não foi atualizado." }, { status: 500 });
  await recordAgentEvent(agent.supabase, agent.user.id, passed ? "course_quiz_passed" : "course_quiz_failed", {
    module_id: moduleId,
    score: result.score,
  });

  return NextResponse.json({ score: result.score, passed, correctCount: result.correctCount, questionCount: result.questionCount, xp, allComplete });
}
