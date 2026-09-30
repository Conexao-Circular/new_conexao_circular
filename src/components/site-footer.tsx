import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPinned, ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <div className="site-footer-brand">
          <div className="site-footer-brand-lockup">
            <Image className="site-footer-logo" src="/abertura/logo-conexao-circular.png" alt="Conexão Circular" width={296} height={86} style={{ height: "auto" }} />
          </div>
          <p className="site-footer-brand-subtitle">Economia circular feita perto de você.</p>
          <p className="site-footer-brand-copy">Conectamos pessoas, negócios e território para escolhas mais conscientes.</p>
        </div>
        <div className="site-footer-links">
          <div>
            <p className="site-footer-label">Explorar</p>
            <Link href="/">Mapa circular <ArrowUpRight /></Link>
            <Link href="/loja" prefetch={false}>Loja <ArrowUpRight /></Link>
            <Link href="/pontos" prefetch={false}>Pontos <ArrowUpRight /></Link>
            <Link href="/impacto" prefetch={false}>Impacto <ArrowUpRight /></Link>
          </div>
          <div>
            <p className="site-footer-label">Participar</p>
            <Link href="/cadastro">Criar conta <ArrowUpRight /></Link>
            <Link href="/agente">Quero ser Agente Circular <ArrowUpRight /></Link>
            <Link href="/login">Entrar <ArrowUpRight /></Link>
            <Link href="/coletas" prefetch={false}>Solicitar coleta <ArrowUpRight /></Link>
          </div>
          <div>
            <p className="site-footer-label">Confiança</p>
            <Link href="/privacidade"><ShieldCheck /> Privacidade</Link>
            <Link href="/termos">Termos de uso</Link>
            <span className="site-footer-note">Dados públicos aparecem somente quando aprovados para a rede.</span>
          </div>
        </div>
      </div>
      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} Conexão Circular</span>
        <span className="site-footer-location"><MapPinned /> Niterói e território</span>
      </div>
    </footer>
  );
}
