"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileUp, Loader2, MapPin, Send, Users } from "lucide-react";

type DashboardData = { profile: { name: string; email: string; agent_status: string | null; agent_neighborhood: string | null; agent_city: string | null; agent_total_xp: number | null; agent_certificate_code: string | null; agent_practical_mission_status: string | null }; counts: { referrals: number; evidences: number; completed_modules: number } };
type Referral = { id: string; name: string; referral_type: string; status: string; city: string | null };

export function AgentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [referral, setReferral] = useState({ referral_type: "business", name: "", responsible_name: "", contact: "", neighborhood: "", city: "Niterói", reason: "", observed_practice: "" });
  const [file, setFile] = useState<File | null>(null);
  const [observation, setObservation] = useState("");

  async function load() {
    setLoading(true);
    const [dashboardResponse, referralsResponse] = await Promise.all([fetch("/api/agent/dashboard", { cache: "no-store" }), fetch("/api/agent/referrals", { cache: "no-store" })]);
    if (dashboardResponse.ok) setData(await dashboardResponse.json());
    if (referralsResponse.ok) setReferrals((await referralsResponse.json()).referrals ?? []);
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);

  async function createReferral(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const response = await fetch("/api/agent/referrals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(referral) });
    const payload = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Indicação registrada para revisão." : payload.error ?? "Não foi possível registrar.");
    if (response.ok) { setReferral((current) => ({ ...current, name: "", responsible_name: "", contact: "", reason: "", observed_practice: "" })); await load(); }
  }

  async function uploadEvidence(event: React.FormEvent) {
    event.preventDefault();
    if (!file) { setMessage("Escolha um arquivo antes de enviar."); return; }
    const body = new FormData(); body.set("file", file); body.set("observation", observation);
    const response = await fetch("/api/agent/evidences", { method: "POST", body });
    const payload = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Evidência enviada para revisão." : payload.error ?? "Não foi possível enviar a evidência.");
    if (response.ok) { setFile(null); setObservation(""); const input = document.getElementById("agent-evidence-file") as HTMLInputElement | null; if (input) input.value = ""; await load(); }
  }

  if (loading || !data) return <div className="mt-10 flex items-center gap-2 text-sm text-cc-green/70"><Loader2 className="h-4 w-4 animate-spin" /> Carregando painel…</div>;
  return <section className="agent-dashboard mt-10 space-y-6">
    <div className="agent-stat-grid grid gap-4 sm:grid-cols-4"><div className="agent-status-card rounded-3xl bg-cc-green p-5 text-white"><p className="text-xs uppercase tracking-wider text-white/60">Status</p><p className="mt-3 text-lg font-semibold">{data.profile.agent_status === "evaluation_pending" ? "Em avaliação" : data.profile.agent_status === "active" ? "Agente ativo" : "Em formação"}</p><p className="mt-1 text-xs text-white/60">{data.profile.agent_neighborhood ?? "Território"}, {data.profile.agent_city ?? "Niterói"}</p>{data.profile.agent_certificate_code ? <p className="mt-4 text-xs text-white/75">Certificado {data.profile.agent_certificate_code}</p> : null}</div><Stat icon={<CheckCircle2 />} value={`${data.counts.completed_modules}/6`} label="módulos" /><Stat icon={<Users />} value={String(data.counts.referrals)} label="indicações" /><Stat icon={<FileUp />} value={String(data.counts.evidences)} label="evidências" /></div>
    {message ? <div className="rounded-2xl border border-cc-orange/30 bg-cc-cream px-4 py-3 text-sm">{message}</div> : null}
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={createReferral} className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-cc-orange">Nova indicação</p><h2 className="mt-2 font-heading text-2xl font-semibold">Quem pode entrar na rede?</h2><p className="mt-2 text-sm text-cc-green/65">Registre um negócio, uma cooperativa ou uma solução orgânica observada no território.</p><div className="mt-5 space-y-3"><select value={referral.referral_type} onChange={(event) => setReferral((current) => ({ ...current, referral_type: event.target.value }))} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="business">Negócio</option><option value="cooperative">Cooperativa</option><option value="organic_solution">Solução orgânica</option></select><input required value={referral.name} onChange={(event) => setReferral((current) => ({ ...current, name: event.target.value }))} placeholder="Nome da iniciativa" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /><div className="grid gap-3 sm:grid-cols-2"><input value={referral.responsible_name} onChange={(event) => setReferral((current) => ({ ...current, responsible_name: event.target.value }))} placeholder="Pessoa responsável" className="h-10 rounded-lg border border-input bg-background px-3 text-sm" /><input value={referral.contact} onChange={(event) => setReferral((current) => ({ ...current, contact: event.target.value }))} placeholder="Contato" className="h-10 rounded-lg border border-input bg-background px-3 text-sm" /></div><input value={referral.neighborhood} onChange={(event) => setReferral((current) => ({ ...current, neighborhood: event.target.value }))} placeholder="Bairro" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /><textarea value={referral.reason} onChange={(event) => setReferral((current) => ({ ...current, reason: event.target.value }))} placeholder="Por que indicar?" rows={3} className="w-full rounded-lg border border-input bg-background p-3 text-sm" /><textarea value={referral.observed_practice} onChange={(event) => setReferral((current) => ({ ...current, observed_practice: event.target.value }))} placeholder="Prática circular observada (opcional)" rows={3} className="w-full rounded-lg border border-input bg-background p-3 text-sm" /><button className="inline-flex items-center gap-2 rounded-full bg-cc-green px-5 py-3 text-sm font-semibold text-white"><Send className="h-4 w-4" /> Registrar indicação</button></div></form>
      <form onSubmit={uploadEvidence} className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-cc-orange">Evidências</p><h2 className="mt-2 font-heading text-2xl font-semibold">Mostre o que aconteceu.</h2><p className="mt-2 text-sm text-cc-green/65">Envie uma foto, vídeo, áudio ou PDF. A equipe revisará antes de qualquer publicação.</p><div className="mt-5 space-y-3"><label htmlFor="agent-evidence-file" className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cc-green/25 bg-cc-cream/30 p-4 text-center text-sm"><FileUp className="mb-2 h-6 w-6 text-cc-orange" /><span>{file?.name ?? "Escolher arquivo até 10 MB"}</span><input id="agent-evidence-file" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,audio/mpeg,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="sr-only" /></label><textarea value={observation} onChange={(event) => setObservation(event.target.value)} placeholder="Observação sobre a evidência" rows={4} className="w-full rounded-lg border border-input bg-background p-3 text-sm" /><button className="inline-flex items-center gap-2 rounded-full bg-cc-orange px-5 py-3 text-sm font-semibold text-[#243015]"><MapPin className="h-4 w-4" /> Enviar para revisão</button></div></form>
    </div>
    <div className="rounded-3xl bg-white p-6 shadow-sm"><h2 className="font-heading text-2xl font-semibold">Suas indicações</h2>{referrals.length === 0 ? <p className="mt-3 text-sm text-cc-green/60">Ainda não há indicações registradas.</p> : <div className="mt-4 divide-y divide-cc-green/10">{referrals.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span><strong>{item.name}</strong><span className="ml-2 text-cc-green/60">{item.referral_type}</span></span><span className="rounded-full bg-cc-cream px-3 py-1 text-xs">{item.status}</span></div>)}</div>}</div>
  </section>;
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <div className="agent-stat-card rounded-3xl bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-cc-orange">{icon}<span className="text-xs uppercase tracking-wider text-cc-green/50">{label}</span></div><p className="mt-3 text-3xl font-semibold">{value}</p></div>; }
