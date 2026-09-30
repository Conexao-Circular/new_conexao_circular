import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="auth-page">
      <div className="auth-stage">
        <section className="auth-visual" aria-label="Conexão Circular">
          <Link href="/" className="auth-brand">
            <LogoMark className="h-11 w-11" variant="color" />
            <span>Conexão Circular</span>
          </Link>
          <div className="auth-visual-copy">
            <span className="auth-eyebrow">ECONOMIA CIRCULAR</span>
            <h2>Conectando pessoas, negócios e território.</h2>
            <p>Faça parte de uma rede que transforma escolhas conscientes em impacto local.</p>
          </div>
          <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
          <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
          <div className="auth-visual-note" aria-hidden="true">♻ Ecossistema circular</div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-heading">
            <p className="auth-kicker">Conexão Circular</p>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {children}
          {footer ? <div className="auth-footer">{footer}</div> : null}
        </section>
      </div>
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </div>
  );
}

export function FormNotice({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="status" aria-live="polite" className="mb-4 rounded-xl border border-cc-sand/40 bg-cc-cream/60 px-3 py-2 text-sm text-cc-green">
      {message}
    </div>
  );
}
