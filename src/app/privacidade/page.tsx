import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PRIVACY_EFFECTIVE_DATE, PRIVACY_VERSION, DPO_CONTACT_EMAIL } from "@/lib/legal";

export const metadata = {
  title: "Política de Privacidade | Conexão Circular",
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
      <Link
        href="/cadastro"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-cc-green/70 hover:text-cc-green"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <h1 className="font-serif text-3xl font-semibold text-cc-green">Política de Privacidade</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Versão {PRIVACY_VERSION} — em vigor desde {PRIVACY_EFFECTIVE_DATE}
      </p>

      <div className="prose-cc mt-8 space-y-6 text-sm leading-relaxed text-foreground">
        <section>
          <h2>Em resumo</h2>
          <p>
            Coletamos só o que precisamos pra fazer a plataforma funcionar: seu cadastro,
            suas compras, suas coletas de resíduo e seus pontos. Não vendemos seus dados.
            CPF/CNPJ só é pedido na hora do checkout, não no cadastro. Você pode pedir pra
            ver, corrigir ou apagar seus dados a qualquer momento.
          </p>
        </section>

        <section>
          <h2>1. Quem é o controlador dos seus dados</h2>
          <p>
            A Conexão Circular é a controladora dos seus dados pessoais — é quem decide como e
            por que eles são tratados na plataforma, nos termos da Lei nº 13.709/2018 (LGPD).
          </p>
          <p>
            Para qualquer assunto sobre seus dados — dúvidas, correções, exclusão — fale com a
            gente em <a href={`mailto:${DPO_CONTACT_EMAIL}`}>{DPO_CONTACT_EMAIL}</a>.
          </p>
        </section>

        <section>
          <h2>2. Quais dados coletamos e por quê</h2>
          <table>
            <thead>
              <tr>
                <th>Dado</th>
                <th>Quando</th>
                <th>Por quê</th>
                <th>Base legal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nome, e-mail, telefone</td>
                <td>Cadastro</td>
                <td>Criar e identificar sua conta</td>
                <td>Execução de contrato</td>
              </tr>
              <tr>
                <td>CPF/CNPJ</td>
                <td>Checkout (não no cadastro)</td>
                <td>Emitir cobrança/nota junto ao meio de pagamento</td>
                <td>Execução de contrato / obrigação legal</td>
              </tr>
              <tr>
                <td>Endereço, foto de comprovação de coleta</td>
                <td>Pedido de coleta ou envio</td>
                <td>Levar a cooperativa até você / calcular frete</td>
                <td>Execução de contrato</td>
              </tr>
              <tr>
                <td>Histórico de compras, pontos, cashback</td>
                <td>Uso da plataforma</td>
                <td>Calcular saldo, benefícios e impacto</td>
                <td>Execução de contrato</td>
              </tr>
              <tr>
                <td>E-mail para novidades/marketing</td>
                <td>Cadastro (opcional)</td>
                <td>Enviar comunicação sobre a plataforma</td>
                <td>Consentimento — você pode revogar quando quiser</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>3. Com quem compartilhamos</h2>
          <ul>
            <li>
              <strong>Cooperativas parceiras:</strong> recebem seu nome, telefone e endereço só
              para realizar a coleta que você solicitou.
            </li>
            <li>
              <strong>Gateway de pagamento:</strong> recebe os dados necessários para processar
              sua compra (nome, CPF/CNPJ, valor).
            </li>
            <li>
              <strong>Parceiro de logística:</strong> recebe endereço e dimensões do pedido
              para calcular e executar o frete.
            </li>
            <li>
              <strong>Produtores parceiros:</strong> veem os dados de pedido necessários para
              enviar o que você comprou.
            </li>
          </ul>
          <p>Não vendemos nem alugamos seus dados pessoais para terceiros.</p>
        </section>

        <section>
          <h2>4. Cookies</h2>
          <p>
            Hoje usamos apenas cookies essenciais de sessão/autenticação (via Supabase Auth),
            necessários para você continuar logado. Não usamos cookies de rastreamento ou
            analytics de terceiros. Se isso mudar, esta política será atualizada antes da
            mudança entrar em vigor.
          </p>
        </section>

        <section>
          <h2>5. Por quanto tempo guardamos seus dados</h2>
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa e pelo tempo necessário para
            cumprir obrigações legais (ex.: fiscais, sobre transações). Ao pedir a exclusão da
            conta, removemos ou anonimizamos os dados que não precisamos mais reter por
            obrigação legal.
          </p>
        </section>

        <section>
          <h2>6. Seus direitos</h2>
          <p>Como titular dos dados, você pode a qualquer momento:</p>
          <ul>
            <li>Confirmar se tratamos seus dados e acessá-los;</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>Pedir a exclusão ou anonimização de dados desnecessários;</li>
            <li>Solicitar a portabilidade dos seus dados;</li>
            <li>Revogar o consentimento de marketing a qualquer momento;</li>
            <li>
              Reclamar junto à Autoridade Nacional de Proteção de Dados (ANPD) caso entenda que
              algo aqui não foi respeitado.
            </li>
          </ul>
          <p>
            Para exercer qualquer um desses direitos, escreva para{" "}
            <a href={`mailto:${DPO_CONTACT_EMAIL}`}>{DPO_CONTACT_EMAIL}</a>.
          </p>
        </section>

        <section>
          <h2>7. Segurança</h2>
          <p>
            Seus dados ficam em infraestrutura com controle de acesso por usuário (linha a
            linha, via Row Level Security), senha nunca é armazenada em texto puro, e o acesso
            a dados sensíveis é restrito por função dentro da equipe.
          </p>
        </section>

        <section>
          <h2>8. Mudanças nesta política</h2>
          <p>
            Se atualizarmos esta política de forma relevante, avisamos por e-mail ou dentro do
            app antes da mudança valer, e a versão vigente sempre fica registrada no topo desta
            página.
          </p>
        </section>
      </div>
    </div>
  );
}
