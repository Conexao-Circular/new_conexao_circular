import type { Metadata } from "next";
import { AgentSiteHeader } from "@/components/agent-site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Agente Circular | Conexão Circular",
  description: "Formação e atuação territorial para quem conecta pessoas, negócios e soluções circulares.",
};

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="agent-shell">
      <AgentSiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
