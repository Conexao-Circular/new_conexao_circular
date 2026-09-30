/** Shared enum → pt-BR label maps (ad-hoc i18n layer). */

export const WASTE_LABELS: Record<string, string> = {
  organic: "Orgânico",
  solid: "Seco",
  both: "Orgânico + Seco",
};

export const COLLECTION_STATUS_LABELS: Record<string, string> = {
  requested: "Solicitada",
  confirmed: "Confirmada",
  canceled: "Cancelada",
};

export const ROLE_LABELS: Record<string, string> = {
  consumidor: "Consumidor Circular",
  produtor: "Produtor Circular",
  cooperativa: "Cooperativa",
  admin: "Administrador",
};

export const PARTNER_CATEGORY_LABELS: Record<string, string> = {
  restaurante: "Restaurante",
  hotel: "Hotel",
  produtor_local: "Produtor local",
  shopping: "Shopping",
  servico: "Serviço",
  outro: "Parceiro",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando pagamento",
  approved: "Aprovado",
  canceled: "Cancelado",
};

export const PRODUCER_APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: "Em análise",
  docs_pending: "Documentação pendente",
  approved: "Aprovado",
  rejected: "Reprovado",
};

export const APPLICANT_TYPE_LABELS: Record<string, string> = {
  produtor: "Produtor / parceiro",
  cooperativa: "Cooperativa de coleta",
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  cartao_cnpj: "Cartão CNPJ",
  licenca: "Alvará / Licença sanitária",
  documento_responsavel: "Documento do responsável",
  certificacao: "Certificação",
  foto_operacao: "Foto da operação",
  outro: "Outro",
};
