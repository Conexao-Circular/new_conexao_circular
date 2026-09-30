"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, CircleAlert, Loader2, LockKeyhole, Send } from "lucide-react";
import { AGENT_COURSE_MODULES, type AgentCourseModule } from "@/lib/agent-course";

type ProgressRow = { course_slug: string; status: string; progress_percent: number; quiz_score?: number | null; quiz_attempts?: number | null; quiz_passed?: boolean | null; xp_earned?: number | null };
type CourseResponse = { modules: AgentCourseModule[]; passingScore: number; progress: ProgressRow[]; profile: { agent_status?: string | null } };

export function AgentTrainingWorkspace() {
  const [data, setData] = useState<CourseResponse | null>(null);
  const [active, setActive] = useState<string>(AGENT_COURSE_MODULES[0].id);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean; xp: number; message?: string } | null>(null);
  const [mission, setMission] = useState({ title: "", description: "" });
  const [missionResult, setMissionResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/agent/course", { cache: "no-store" });
    if (response.ok) setData(await response.json());
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);

  const progressByModule = useMemo(() => new Map((data?.progress ?? []).map((row) => [row.course_slug, row])), [data]);
  const completed = (id: string) => progressByModule.get(id)?.quiz_passed || progressByModule.get(id)?.status === "completed";
  const allCompleted = data?.modules.every((module) => completed(module.id)) ?? false;
  const currentModule = data?.modules.find((item) => item.id === active) ?? data?.modules[0];

  async function submitQuiz() {
    if (!currentModule) return;
    setSending(true);
    setResult(null);
    const response = await fetch("/api/agent/course", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ moduleId: currentModule.id, answers }) });
    const payload = await response.json().catch(() => ({}));
    setResult(response.ok ? payload : { score: 0, passed: false, xp: 0, message: payload.error ?? "Não foi possível corrigir agora." });
    if (response.ok) {
      setAnswers({});
      await load();
    }
    setSending(false);
  }

  async function submitMission() {
    setSending(true);
    const response = await fetch("/api/agent/mission", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(mission) });
    const payload = await response.json().catch(() => ({}));
    setMissionResult(response.ok ? "Missão enviada para revisão da equipe." : payload.error ?? "Não foi possível enviar a missão.");
    setSending(false);
  }

  if (loading) return <div className="mt-10 flex items-center gap-2 text-sm text-cc-green/70"><Loader2 className="h-4 w-4 animate-spin" /> Carregando sua formação…</div>;
  if (!data || !currentModule) return <div className="mt-10 rounded-2xl bg-white p-5 text-sm">Não foi possível carregar sua formação. Atualize a página para tentar novamente.</div>;

  return (
    <section className="agent-training-grid mt-10 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
      <aside className="agent-course-nav space-y-2">
        <div className="agent-progress-card mb-4 rounded-2xl bg-cc-green p-5 text-white"><p className="text-xs uppercase tracking-wider text-white/60">Seu progresso</p><p className="mt-2 text-3xl font-semibold">{data.progress.filter((row) => row.quiz_passed || row.status === "completed").length}/{data.modules.length}</p><p className="mt-1 text-sm text-white/70">módulos aprovados</p></div>
        {data.modules.map((item, index) => {
          const locked = index > 0 && !completed(data.modules[index - 1].id);
          const done = completed(item.id);
          return <button key={item.id} type="button" disabled={locked} onClick={() => { setActive(item.id); setResult(null); setAnswers({}); }} className={`agent-course-step flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${active === item.id ? "is-active border-cc-orange bg-white" : "border-transparent bg-white/60"} ${locked ? "cursor-not-allowed opacity-50" : "hover:bg-white"}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cc-cream text-sm font-semibold">{done ? <CheckCircle2 className="h-5 w-5 text-cc-green" /> : locked ? <LockKeyhole className="h-4 w-4" /> : index + 1}</span><span><span className="block text-sm font-semibold">{item.title}</span><span className="mt-1 block text-xs text-cc-green/60">{item.duration}</span></span></button>;
        })}
      </aside>

      <div className="space-y-6">
        <article className="agent-content-card rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-cc-orange">Módulo {currentModule.number}</p>
          <h2 className="mt-2 font-heading text-2xl font-semibold">{currentModule.title}</h2>
          <p className="mt-2 text-sm leading-6 text-cc-green/70">{currentModule.summary}</p>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-cc-green/80">{currentModule.lessons.map((lesson) => <li key={lesson} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cc-orange" />{lesson}</li>)}</ul>
          <div className="mt-8 border-t border-cc-green/10 pt-6">
            <h3 className="font-heading text-lg font-semibold">Quiz do módulo</h3>
            <p className="mt-1 text-xs text-cc-green/60">Você precisa de pelo menos {data.passingScore}% para avançar. Respostas erradas não geram XP.</p>
            <div className="mt-5 space-y-5">{currentModule.quiz.map((question, index) => <fieldset key={question.id} className="space-y-2"><legend className="text-sm font-medium">{index + 1}. {question.question}</legend>{question.options.map((option, optionIndex) => <label key={option} className="flex cursor-pointer items-start gap-2 rounded-xl border border-cc-green/10 px-3 py-2 text-sm hover:bg-cc-cream/40"><input type="radio" name={question.id} checked={answers[question.id] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))} className="mt-1 accent-cc-orange" />{option}</label>)}</fieldset>)}</div>
            <button type="button" disabled={sending || Object.keys(answers).length !== currentModule.quiz.length} onClick={submitQuiz} className="mt-6 inline-flex items-center gap-2 rounded-full bg-cc-green px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />} Enviar respostas</button>
            {result ? <div className={`mt-4 flex gap-2 rounded-xl p-3 text-sm ${result.passed ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>{result.passed ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <CircleAlert className="h-5 w-5 shrink-0" />}<span>{result.message ?? `Nota: ${result.score}%. ${result.passed ? `Você ganhou ${result.xp} XP.` : "Tente novamente revisando o conteúdo."}`}</span></div> : null}
          </div>
        </article>

        {allCompleted ? <article className="rounded-3xl border border-cc-orange/30 bg-cc-cream/50 p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-wider text-cc-orange">Última etapa</p><h2 className="mt-2 font-heading text-2xl font-semibold">Uma missão prática no seu território</h2><p className="mt-2 text-sm leading-6 text-cc-green/70">Escolha uma ação pequena, concreta e verificável. A equipe revisará sua missão antes da certificação.</p><div className="mt-5 space-y-3"><input value={mission.title} onChange={(event) => setMission((current) => ({ ...current, title: event.target.value }))} placeholder="Título da missão" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /><textarea value={mission.description} onChange={(event) => setMission((current) => ({ ...current, description: event.target.value }))} placeholder="O que você vai conectar ou observar?" rows={4} className="w-full rounded-lg border border-input bg-background p-3 text-sm" /><button type="button" disabled={sending} onClick={submitMission} className="inline-flex items-center gap-2 rounded-full bg-cc-orange px-5 py-3 text-sm font-semibold text-[#243015] disabled:opacity-50"><Send className="h-4 w-4" /> Enviar missão para revisão</button>{missionResult ? <p className="text-sm text-cc-green/80">{missionResult}</p> : null}</div></article> : null}
      </div>
    </section>
  );
}
