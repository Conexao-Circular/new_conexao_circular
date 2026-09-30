"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

type Profile = { agent_bio: string | null; agent_neighborhood: string | null; agent_city: string | null; agent_is_available: boolean; agent_interests: string[] };

export function AgentProfileForm({ initial }: { initial: Profile }) {
  const [form, setForm] = useState({ bio: initial.agent_bio ?? "", neighborhood: initial.agent_neighborhood ?? "", city: initial.agent_city ?? "", available: initial.agent_is_available, interests: initial.agent_interests ?? [] });
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setMessage(null);
    const response = await fetch("/api/agent/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ agent_bio: form.bio, agent_neighborhood: form.neighborhood, agent_city: form.city, agent_is_available: form.available, agent_interests: form.interests }) });
    setMessage(response.ok ? "Perfil atualizado." : (await response.json().catch(() => ({}))).error ?? "Não foi possível salvar."); setSaving(false);
  }
  return <form onSubmit={save} className="agent-profile-card mt-10 space-y-5 rounded-3xl bg-white p-6 shadow-sm sm:p-8"><div><label htmlFor="agent-bio" className="text-sm font-medium">Apresentação</label><textarea id="agent-bio" value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} rows={5} maxLength={1000} placeholder="Conte brevemente como você se conecta ao território." className="mt-2 w-full rounded-lg border border-input bg-background p-3 text-sm" /></div><div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="agent-profile-neighborhood" className="text-sm font-medium">Bairro</label><input id="agent-profile-neighborhood" value={form.neighborhood} onChange={(event) => setForm((current) => ({ ...current, neighborhood: event.target.value }))} className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></div><div><label htmlFor="agent-profile-city" className="text-sm font-medium">Cidade</label><input id="agent-profile-city" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" /></div></div><label className="agent-availability-toggle flex items-center gap-2 text-sm"><input type="checkbox" checked={form.available} onChange={(event) => setForm((current) => ({ ...current, available: event.target.checked }))} className="h-4 w-4 accent-cc-orange" /> Estou disponível para novas conexões</label><button disabled={saving} className="agent-button agent-button-primary disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Salvar perfil</button>{message ? <p className="text-sm text-cc-green/70">{message}</p> : null}</form>;
}
