import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAuthenticatedAgent } from "@/lib/agent-auth";
import { AgentProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function AgentProfilePage() {
  const agent = await getAuthenticatedAgent();
  if (!agent) redirect("/login");
  return (
    <main className="agent-page agent-profile-page">
      <div className="agent-page-inner max-w-3xl">
        <Link href="/agente/painel" className="inline-flex items-center gap-2 text-sm font-medium text-cc-green/70 hover:text-cc-green"><ArrowLeft className="h-4 w-4" /> Voltar ao painel</Link>
        <header className="agent-page-heading agent-page-heading-narrow"><div><p>Perfil do agente</p><h1>Como o território conhece você.</h1><span>Mantenha disponibilidade, apresentação e região atualizadas para a curadoria.</span></div></header>
        <AgentProfileForm initial={agent.profile} />
      </div>
    </main>
  );
}
