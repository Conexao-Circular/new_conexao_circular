import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TERMS_EFFECTIVE_DATE, TERMS_VERSION, DPO_CONTACT_EMAIL } from "@/lib/legal";

export const metadata = {
  title: "Termos de Uso | Conexão Circular",
};

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
      <Link
        href="/cadastro"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-cc-green/70 hover:text-cc-green"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <h1 className="font-serif text-3xl font-semibold text-cc-green">Termos de Uso</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Versão {TERMS_VERSION} — em vigor desde {TERMS_EFFECTIVE_DATE}
      </p>

      <div className="prose-cc mt-8 space-y-6 text-sm leading-relaxed text-foreground">
        <section>
          <h2>Em resumo</h2>
          <p>
            A Conexão Circular é uma plataforma que conecta pessoas a produtos, empresas e
            iniciativas sustentáveis, e organiza a coleta de resíduos recicláveis com
            cooperativas parceiras. Ao criar uma conta, você concorda com estas regras de uso.
            Se algo aqui não fizer sentido pra você, escreva pra gente em{" "}
            <a href={`mailto:${DPO_CONTACT_EMAIL}`}>{DPO_CONTACT_EMAIL}</a> antes de aceitar.
          </p>
        </section>

        <section>
          <h2>1. Quem somos</h2>
          <p>
            A Conexão Circular, pessoa jurídica que opera esta plataforma, é doravante
            referida como &ldquo;nós&rdquo; ou &ldquo;plataforma&rdquo;.
          </p>
        </section>

        <section>
          <h2>2. O que você pode fazer na plataforma</h2>
          <ul>
            <li>
              <strong>Consumidor:</strong> comprar produtos de parceiros sustentáveis, pedir
              coleta de resíduos recicláveis, acumular pontos e cashback, e acompanhar o
              impacto das suas escolhas.
            </li>
            <li>
              <strong>Produtor:</strong> cadastrar e vender produtos no marketplace, com
              aprovação prévia da nossa curadoria.
            </li>
            <li>
              <strong>Cooperativa:</strong> receber e confirmar solicitações de coleta na sua
              área de atuação.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Sua conta</h2>
          <p>
            Você é responsável por manter seus dados de cadastro corretos e sua senha em
            sigilo. Avise a gente imediatamente se suspeitar de uso indevido da sua conta.
            Contas podem ser suspensas em caso de fraude, abuso da plataforma, ou
            descumprimento destes Termos.
          </p>
        </section>

        <section>
          <h2>4. Compras, pagamentos e coletas</h2>
          <p>
            Pagamentos são processados por um parceiro de pagamentos (gateway homologado) e
            fretes são calculados por um parceiro de logística no momento do checkout — nunca
            no cadastro. Coletas de resíduos são agendadas com cooperativas parceiras da sua
            região; a confirmação do peso coletado é feita pela cooperativa e gera pontos na
            sua conta.
          </p>
        </section>

        <section>
          <h2>5. Curadoria de produtos e parceiros</h2>
          <p>
            Todo produto e parceiro passa por uma análise antes de aparecer na plataforma.
            Isso não é uma garantia de que resolvemos todo problema entre você e um parceiro —
            leia a descrição do produto e, em caso de problema com um pedido, entre em contato
            com o suporte.
          </p>
        </section>

        <section>
          <h2>6. Privacidade</h2>
          <p>
            Como tratamos seus dados pessoais está descrito, em detalhe, na nossa{" "}
            <Link href="/privacidade">Política de Privacidade</Link> — leia também antes de
            aceitar estes Termos.
          </p>
        </section>

        <section>
          <h2>7. O que não é permitido</h2>
          <ul>
            <li>Criar contas falsas ou se passar por outra pessoa/empresa.</li>
            <li>Usar a plataforma para atividades ilegais ou fraudulentas.</li>
            <li>Tentar burlar a curadoria com produtos ou informações falsas.</li>
            <li>Interferir no funcionamento técnico da plataforma.</li>
          </ul>
        </section>

        <section>
          <h2>8. Mudanças nestes Termos</h2>
          <p>
            Podemos atualizar estes Termos conforme a plataforma evolui. Mudanças relevantes
            serão avisadas por e-mail ou dentro do app, e a versão vigente sempre fica
            registrada no topo desta página. O uso continuado da plataforma após uma
            atualização significa que você concorda com a nova versão.
          </p>
        </section>

        <section>
          <h2>9. Dúvidas</h2>
          <p>
            Fale com a gente em <a href={`mailto:${DPO_CONTACT_EMAIL}`}>{DPO_CONTACT_EMAIL}</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
