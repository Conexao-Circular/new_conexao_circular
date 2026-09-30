import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function AgentSiteHeader() {
  return (
    <header className="agent-site-header">
      <div className="agent-site-header-inner">
        <Link href="/" className="agent-site-brand" aria-label="Conexão Circular — página inicial">
          <Image src="/abertura/logo-conexao-circular.png" alt="Conexão Circular" width={296} height={86} style={{ height: "auto" }} priority />
        </Link>

        <nav className="agent-site-nav" aria-label="Navegação do Agente Circular">
          <Link href="/agente#atuacao">O que faz</Link>
          <Link href="/agente#jornada">Jornada</Link>
          <Link href="/">Mapa circular</Link>
          <Link href="/agente/painel" prefetch={false}>Meu painel</Link>
        </nav>

        <div className="agent-site-actions">
          <Link href="/login" className="agent-header-login">Entrar</Link>
          <Link href="/cadastro?role=agent_circular" className="agent-header-cta">
            <span className="agent-header-cta-long">Quero ser agente</span>
            <span className="agent-header-cta-short">Participar</span>
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
