export const DOCUMENT_TYPE_OPTIONS = [
  { value: "cartao_cnpj", label: "Cartão CNPJ" },
  { value: "licenca", label: "Alvará / Licença sanitária" },
  { value: "documento_responsavel", label: "Documento do responsável (RG/CNH)" },
  { value: "certificacao", label: "Certificação" },
  { value: "foto_operacao", label: "Foto da operação" },
  { value: "outro", label: "Outro" },
] as const;

export type DocumentType = (typeof DOCUMENT_TYPE_OPTIONS)[number]["value"];

export function isDocumentType(value: string): value is DocumentType {
  return DOCUMENT_TYPE_OPTIONS.some((option) => option.value === value);
}

export const APPLICANT_TYPE_OPTIONS = [
  {
    value: "produtor",
    title: "Produtor / parceiro",
    description: "Vendo produtos sustentáveis no marketplace.",
  },
  {
    value: "cooperativa",
    title: "Cooperativa de coleta",
    description: "Faço coleta e triagem de resíduos da rede.",
  },
] as const;

export type ApplicantType = (typeof APPLICANT_TYPE_OPTIONS)[number]["value"];

export function isApplicantType(value: string): value is ApplicantType {
  return APPLICANT_TYPE_OPTIONS.some((option) => option.value === value);
}

export const BUSINESS_SIZE_OPTIONS = [
  { value: "mei", label: "MEI" },
  { value: "me", label: "Microempresa (ME)" },
  { value: "epp", label: "Empresa de Pequeno Porte (EPP)" },
  { value: "outro", label: "Outro" },
] as const;

export const BANK_ACCOUNT_TYPE_OPTIONS = [
  { value: "corrente", label: "Conta corrente" },
  { value: "pagamentos", label: "Conta de pagamentos" },
] as const;

export const WASTE_TYPE_OPTIONS = [
  { value: "organic", title: "Orgânico", description: "Restos de alimentos, podas e resíduos compostáveis." },
  { value: "solid", title: "Seco", description: "Papel, plástico, vidro e metal recicláveis." },
  { value: "both", title: "Ambos", description: "Orgânico e seco juntos." },
] as const;
