import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAuthenticatedAgent } from "@/lib/agent-auth";
import { AgentDashboard } from "./dashboard";

export const dynamic = "force-dynamic";

export default async function AgentDashboardPage() {
  const agent = await getAuthenticatedAgent();
  if (!agent) redirect("/login");
  return (
    <main className="agent-page agent-dashboard-page">
      <div className="agent-page-inner max-w-6xl">
        <Link href="/agente" className="inline-flex items-center gap-2 text-sm font-medium text-cc-green/70 hover:text-cc-green"><ArrowLeft className="h-4 w-4" /> Sobre o programa</Link>
        <header className="agent-page-heading"><div><p>Área do Agente Circular</p><h1>Seu território, suas conexões.</h1><span>Acompanhe formação, indicações, evidências e o próximo passo da sua jornada.</span></div><div className="agent-page-actions"><Link href="/agente/perfil" className="agent-button agent-button-outline">Editar perfil</Link><Link href="/agente/formacao" className="agent-button agent-button-primary">Continuar formação</Link></div></header>
        <AgentDashboard />
      </div>
    </main>
  );
}
