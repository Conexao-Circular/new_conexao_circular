import Link from "next/link";
import { ArrowRight, Building2, Camera, Check, MapPin, Network, Recycle, Sprout } from "lucide-react";
import { notFound } from "next/navigation";
import { isAgentCircularEnabled } from "@/lib/agent-circular";

const journey = [
  { title: "Faça seu cadastro", detail: "Conte quem você é e onde atua." },
  { title: "Complete a formação", detail: "Seis módulos curtos, com nota mínima de 80%." },
  { title: "Realize uma missão", detail: "Registre uma conexão real no seu território." },
  { title: "Ative seu perfil", detail: "A equipe revisa a jornada e libera sua atuação." },
];

export default function AgentLandingPage() {
  if (!isAgentCircularEnabled()) notFound();

  return (
    <main className="agent-landing">
      <section className="agent-hero" aria-labelledby="agent-title">
        <div className="agent-hero-copy">
          <p className="agent-eyebrow"><MapPin aria-hidden="true" /> Programa piloto em Niterói</p>
          <h1 id="agent-title">Conecte o território. Faça a circularidade acontecer.</h1>
          <p className="agent-hero-lead">O Agente Circular identifica oportunidades, aproxima pessoas e registra as conexões que fortalecem a economia local.</p>
          <div className="agent-hero-actions">
            <Link href="/cadastro?role=agent_circular" className="agent-button agent-button-primary">Quero ser Agente Circular <ArrowRight aria-hidden="true" /></Link>
            <Link href="/" className="agent-button agent-button-ghost">Explorar o mapa</Link>
          </div>
          <dl className="agent-hero-facts" aria-label="Informações do programa">
            <div><dt>Formação</dt><dd>6 módulos</dd></div>
            <div><dt>Missão</dt><dd>1 prática local</dd></div>
            <div><dt>Entrada</dt><dd>Inscrição aberta</dd></div>
          </dl>
        </div>

        <div className="agent-route-card" aria-label="Resumo da jornada de formação">
          <div className="agent-route-card-head"><span className="agent-route-symbol"><Network aria-hidden="true" /></span><div><span>Jornada do agente</span><strong>Da escuta à conexão</strong></div></div>
          <ol className="agent-route-list">
            {journey.map((step, index) => <li key={step.title}><span className="agent-route-node">{index + 1}</span><div><strong>{step.title}</strong><p>{step.detail}</p></div></li>)}
          </ol>
          <p className="agent-route-note"><Check aria-hidden="true" /> Acompanhamento e revisão da equipe Conexão Circular</p>
        </div>
      </section>

      <section id="atuacao" className="agent-role-section" aria-labelledby="agent-role-title">
        <div className="agent-section-heading"><p>Atuação no território</p><h2 id="agent-role-title">Você enxerga oportunidades onde outras pessoas veem distância.</h2><span>O trabalho começa na escuta e ganha força quando a conexão é registrada, acompanhada e comprovada.</span></div>
        <div className="agent-role-grid">
          <article><span><Building2 aria-hidden="true" /></span><h3>Descubra iniciativas</h3><p>Indique negócios, cooperativas e soluções orgânicas que já movimentam o seu bairro.</p></article>
          <article><span><Network aria-hidden="true" /></span><h3>Aproxime a rede</h3><p>Conecte necessidades e capacidades de forma responsável, com contexto e consentimento.</p></article>
          <article><span><Camera aria-hidden="true" /></span><h3>Registre evidências</h3><p>Mostre o que aconteceu para que a equipe possa revisar, reconhecer e dar visibilidade ao impacto.</p></article>
        </div>
      </section>

      <section id="jornada" className="agent-journey-section" aria-labelledby="agent-journey-title">
        <div className="agent-journey-intro"><p>Formação aplicada</p><h2 id="agent-journey-title">Aprenda hoje. Experimente no bairro amanhã.</h2><span>A trilha combina conteúdo objetivo, avaliação e uma missão prática — sem exigir experiência anterior.</span><Link href="/cadastro?role=agent_circular" className="agent-text-link">Começar minha jornada <ArrowRight aria-hidden="true" /></Link></div>
        <div className="agent-learning-map">
          <div><Recycle aria-hidden="true" /><span>Base</span><strong>Economia circular, resíduos e PNRS</strong></div>
          <div><Sprout aria-hidden="true" /><span>Impacto</span><strong>ODS, território e práticas observáveis</strong></div>
          <div><Building2 aria-hidden="true" /><span>Ação</span><strong>Avaliação de negócios e missão do agente</strong></div>
        </div>
      </section>

      <section className="agent-final-cta" aria-labelledby="agent-final-title">
        <div><p>Uma rede circular começa com alguém que aproxima.</p><h2 id="agent-final-title">Esse alguém pode ser você.</h2></div>
        <Link href="/cadastro?role=agent_circular" className="agent-button agent-button-primary">Fazer minha inscrição <ArrowRight aria-hidden="true" /></Link>
      </section>
    </main>
  );
}
