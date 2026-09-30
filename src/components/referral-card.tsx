"use client";

import { useState } from "react";
import { Check, Copy, Users } from "lucide-react";

export function ReferralCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/cadastro?ref=${code}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Conexão Circular", text: "Entre na Conexão Circular comigo!", url: link });
        return;
      }
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="points-referral-card rounded-2xl border border-cc-orange/20 bg-cc-orange/5 p-4">
      <div className="flex items-center gap-2 text-cc-orange">
        <Users className="h-5 w-5" />
        <h3 className="font-heading text-lg font-semibold">Convide amigos</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Compartilhe seu código e cresça a rede circular.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className="flex-1 rounded-lg border border-cc-orange/30 bg-cc-paper px-3 py-2 text-center font-mono text-lg font-semibold tracking-widest text-cc-green">
          {code}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-lg bg-cc-orange px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado" : "Convidar"}
        </button>
      </div>
    </div>
  );
}
