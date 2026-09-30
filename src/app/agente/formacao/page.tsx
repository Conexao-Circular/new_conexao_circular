import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAuthenticatedAgent } from "@/lib/agent-auth";
import { AgentTrainingWorkspace } from "./training-workspace";

export const dynamic = "force-dynamic";

export default async function AgentTrainingPage() {
  const agent = await getAuthenticatedAgent();
  if (!agent) redirect("/login");

  return (
    <main className="agent-page agent-training-page">
      <div className="agent-page-inner max-w-5xl">
        <Link href="/agente/painel" className="inline-flex items-center gap-2 text-sm font-medium text-cc-green/70 hover:text-cc-green"><ArrowLeft className="h-4 w-4" /> Voltar ao painel</Link>
        <header className="agent-page-heading agent-page-heading-narrow">
          <div><p>Formação do Agente Circular</p><h1>Aprenda a fazer conexões que cuidam do território.</h1><span>São seis módulos, quizzes com nota mínima de 80% e uma missão prática única revisada pela equipe.</span></div>
        </header>
        <AgentTrainingWorkspace />
      </div>
    </main>
  );
}
