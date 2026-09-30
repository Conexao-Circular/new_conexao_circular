import "server-only";

/**
 * Transactional email via the Resend API (same account used for Supabase
 * Auth's SMTP). No-op when RESEND_API_KEY isn't set — same pattern as
 * push/Asaas/freight, so dev/preview keep working without the key.
 */
export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Where the app is actually served — used for the logo and CTA links inside emails. */
function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://conexao-circular.vercel.app";
}

async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  // Must stay on a domain verified at Resend, or every send comes back 550.
  const from = process.env.EMAIL_FROM ?? "Conexão Circular <contato@conexaocircular.com.br>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
    });

    if (!response.ok) {
      // Resend rejects with 4xx for things that look fine from here — an
      // unverified sender domain being the usual one. Without this the whole
      // email system fails silently and looks like it simply never fired.
      console.error(
        `[email] Resend recusou o envio (${response.status}): ${await response.text()}`,
      );
    }
  } catch (error) {
    // Best-effort — an email failure should never break a checkout/fulfillment flow.
    console.error("[email] Falha ao chamar a API do Resend:", error);
  }
}

/** Same visual shell as supabase/email-templates/*.html, for a consistent brand across every email the app sends. */
function renderBrandEmail(opts: { heading: string; bodyHtml: string; ctaText?: string; ctaUrl?: string }) {
  const cta =
    opts.ctaText && opts.ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:8px;">
           <tr>
             <td style="border-radius:10px; background-color:#c87247;">
               <a href="${opts.ctaUrl}" style="display:inline-block; padding:12px 28px; color:#fffaf5; font-size:14px; font-weight:600; text-decoration:none; border-radius:10px;">
                 ${opts.ctaText}
               </a>
             </td>
           </tr>
         </table>`
      : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <body style="margin:0; padding:0; background-color:#e2d5c6; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#e2d5c6; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#fffaf5; border-radius:16px; overflow:hidden;">
            <tr>
              <td style="background-color:#364437; padding:28px 32px; text-align:center;">
                <img src="${siteUrl()}/icons/icon-192.png" width="48" height="48" alt="Conexão Circular" style="border-radius:12px; display:inline-block;" />
                <div style="color:#e2d5c6; font-size:18px; font-weight:600; margin-top:10px;">Conexão Circular</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px; color:#364437; font-size:22px; font-weight:600;">${opts.heading}</h1>
                <div style="margin:0 0 20px; color:#364437; font-size:14px; line-height:1.6;">${opts.bodyHtml}</div>
                ${cta}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

type OrderEmailInfo = { buyerEmail: string; orderCode: string; orderId: string };

function orderUrl(orderId: string) {
  return `${siteUrl()}/loja/pedidos/${orderId}`;
}

export async function sendOrderConfirmedEmail(info: OrderEmailInfo) {
  await sendEmail({
    to: info.buyerEmail,
    subject: `Pedido ${info.orderCode} confirmado — Conexão Circular`,
    html: renderBrandEmail({
      heading: "Pagamento confirmado! 🎉",
      bodyHtml: `Seu pedido <strong>${info.orderCode}</strong> foi aprovado e já está sendo preparado pelos parceiros. Você recebe um novo e-mail a cada etapa até a entrega.`,
      ctaText: "Acompanhar pedido",
      ctaUrl: orderUrl(info.orderId),
    }),
  });
}

export async function sendOrderCollectedEmail(info: OrderEmailInfo) {
  await sendEmail({
    to: info.buyerEmail,
    subject: `Pedido ${info.orderCode} coletado — Conexão Circular`,
    html: renderBrandEmail({
      heading: "Seu pedido foi coletado 📦",
      bodyHtml: `A transportadora já retirou o pedido <strong>${info.orderCode}</strong> com o parceiro. Em breve ele entra em transporte até você.`,
      ctaText: "Acompanhar pedido",
      ctaUrl: orderUrl(info.orderId),
    }),
  });
}

export async function sendOrderShippedEmail(
  info: OrderEmailInfo & { carrier?: string | null; trackingCode?: string | null },
) {
  const tracking =
    info.trackingCode
      ? `<br />Rastreio: <strong>${info.trackingCode}</strong>${info.carrier ? ` (${info.carrier})` : ""}`
      : "";

  await sendEmail({
    to: info.buyerEmail,
    subject: `Pedido ${info.orderCode} a caminho — Conexão Circular`,
    html: renderBrandEmail({
      heading: "Seu pedido está a caminho 🚚",
      bodyHtml: `O pedido <strong>${info.orderCode}</strong> está em transporte até você.${tracking}`,
      ctaText: "Acompanhar pedido",
      ctaUrl: orderUrl(info.orderId),
    }),
  });
}

export async function sendOrderDeliveredEmail(info: OrderEmailInfo) {
  await sendEmail({
    to: info.buyerEmail,
    subject: `Pedido ${info.orderCode} entregue — Conexão Circular`,
    html: renderBrandEmail({
      heading: "Pedido entregue! ✅",
      bodyHtml: `O pedido <strong>${info.orderCode}</strong> foi entregue. Obrigado por escolher parceiros sustentáveis da Conexão Circular.`,
      ctaText: "Ver pedido",
      ctaUrl: orderUrl(info.orderId),
    }),
  });
}

type PartnerCurationDecision = "approved" | "rejected" | "docs_pending";

const PARTNER_CURATION_CONTENT: Record<
  PartnerCurationDecision,
  { subject: string; heading: string; defaultBody: string }
> = {
  approved: {
    subject: "Perfil de parceiro aprovado! 🎉 — Conexão Circular",
    heading: "Você é um parceiro verificado! 🎉",
    defaultBody: "Sua loja agora é um parceiro verificado da Conexão Circular.",
  },
  rejected: {
    subject: "Candidatura de parceiro reprovada — Conexão Circular",
    heading: "Candidatura reprovada",
    defaultBody: "Revise os dados enviados e tente novamente.",
  },
  docs_pending: {
    subject: "Falta documentação na sua candidatura — Conexão Circular",
    heading: "Falta documentação",
    defaultBody: "A curadoria pediu mais informações — confira o que falta e reenvie.",
  },
};

export async function sendPartnerCurationEmail(info: {
  to: string;
  decision: PartnerCurationDecision;
  reviewNote?: string | null;
}) {
  const content = PARTNER_CURATION_CONTENT[info.decision];

  await sendEmail({
    to: info.to,
    subject: content.subject,
    html: renderBrandEmail({
      heading: content.heading,
      bodyHtml: info.reviewNote
        ? `${info.reviewNote}`
        : content.defaultBody,
      ctaText: "Ver candidatura",
      ctaUrl: `${siteUrl()}/onboarding/parceiro`,
    }),
  });
}
