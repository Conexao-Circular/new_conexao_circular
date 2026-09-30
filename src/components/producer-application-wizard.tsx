"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductWizardSteps } from "@/components/product-wizard-steps";
import { ProducerDocumentInput, type ExistingDocument } from "@/components/producer-document-input";
import { CepAddressFields, type AddressDefaults } from "@/components/cep-address-fields";
import {
  BANK_ACCOUNT_TYPE_OPTIONS,
  BUSINESS_SIZE_OPTIONS,
  WASTE_TYPE_OPTIONS,
  type ApplicantType,
} from "@/lib/producer-application";
import { DPO_CONTACT_EMAIL } from "@/lib/legal";
import { submitProducerApplication } from "@/app/onboarding/parceiro/actions";

const STEPS = [
  "Dados cadastrais",
  "Endereço",
  "Perfil sustentável",
  "Dados de repasse",
  "Documentos",
  "Revisão",
] as const;

export type ProducerApplicationDefaults = {
  cnpj: string;
  razaoSocial: string;
  responsavelNome: string;
  responsavelTelefone: string;
  contatoEmail: string;
  businessAddress?: AddressDefaults;
  businessSize: string;
  foundedYear: string;
  websiteUrl: string;
  stateRegistration: string;
  wasteType: string;
  capacityKgDay: string;
  serviceArea: string;
  sustainabilityDescription: string;
  materialOrigin: string;
  operationDescription: string;
  bankName: string;
  bankAccountType: string;
  bankAgency: string;
  bankAccount: string;
  pixKey: string;
  partnerTermsAccepted: boolean;
};

const COPY = {
  produtor: {
    sustainability: {
      label: "O que você produz ou coleta?",
      placeholder: "Descreva seus produtos/serviços e o que os torna sustentáveis.",
    },
    materialOrigin: {
      label: "De onde vêm os materiais?",
      placeholder: "Ex: resíduo têxtil de confecções parceiras, coleta seletiva própria...",
    },
    operation: {
      label: "Como funciona a operação?",
      placeholder: "Passo a passo de como o material vira produto, quem participa, onde acontece.",
    },
  },
  cooperativa: {
    sustainability: {
      label: "O que a cooperativa coleta?",
      placeholder: "Ex: recicláveis secos (papel, plástico, metal, vidro) de residências e comércios.",
    },
    materialOrigin: {
      label: "De onde vem o material coletado?",
      placeholder: "Ex: coleta porta a porta, pontos de entrega voluntária, parceria com condomínios...",
    },
    operation: {
      label: "Como funciona a triagem e a operação?",
      placeholder: "Passo a passo: coleta, transporte, triagem, destinação final.",
    },
  },
} as const;

function formatCnpj(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 14);
  if (d.length > 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  if (d.length > 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  if (d.length > 5) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length > 2) return `${d.slice(0, 2)}.${d.slice(2)}`;
  return d;
}

export function ProducerApplicationWizard({
  userId,
  applicantType,
  defaults,
  documents = [],
}: {
  userId: string;
  applicantType: ApplicantType;
  defaults?: ProducerApplicationDefaults;
  documents?: ExistingDocument[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState({
    cnpj: defaults?.cnpj ?? "",
    razao_social: defaults?.razaoSocial ?? "",
    responsavel_nome: defaults?.responsavelNome ?? "",
    sustainability_description: defaults?.sustainabilityDescription ?? "",
    material_origin: defaults?.materialOrigin ?? "",
    operation_description: defaults?.operationDescription ?? "",
    pix_key: defaults?.pixKey ?? "",
  });
  const [termsAccepted, setTermsAccepted] = useState(defaults?.partnerTermsAccepted ?? false);
  const razaoSocialRef = useRef<HTMLInputElement>(null);
  const [cnpjLookup, setCnpjLookup] = useState<{ loading: boolean; error: string | null; cnae: string | null }>({
    loading: false,
    error: null,
    cnae: null,
  });
  const [addressAutoFill, setAddressAutoFill] = useState<AddressDefaults | null>(null);
  const [addressAutoFillNonce, setAddressAutoFillNonce] = useState(0);

  const copy = COPY[applicantType];

  async function handleCnpjBlur(event: React.FocusEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "");
    if (digits.length !== 14) return;

    setCnpjLookup({ loading: true, error: null, cnae: null });
    try {
      const response = await fetch(`/api/cnpj?cnpj=${digits}`);
      const data = await response.json();
      if (!response.ok) {
        setCnpjLookup({ loading: false, error: data.error ?? "CNPJ não encontrado.", cnae: null });
        return;
      }
      if (data.razaoSocial && razaoSocialRef.current && !razaoSocialRef.current.value.trim()) {
        razaoSocialRef.current.value = data.razaoSocial;
      }
      if (data.address) {
        setAddressAutoFill(data.address);
        setAddressAutoFillNonce((n) => n + 1);
      }
      setCnpjLookup({ loading: false, error: null, cnae: data.cnaeDescricao ?? null });
      syncPreview();
    } catch {
      setCnpjLookup({ loading: false, error: "Não foi possível consultar o CNPJ agora.", cnae: null });
    }
  }

  function syncPreview() {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    setPreview({
      cnpj: String(data.get("cnpj") ?? ""),
      razao_social: String(data.get("razao_social") ?? ""),
      responsavel_nome: String(data.get("responsavel_nome") ?? ""),
      sustainability_description: String(data.get("sustainability_description") ?? ""),
      material_origin: String(data.get("material_origin") ?? ""),
      operation_description: String(data.get("operation_description") ?? ""),
      pix_key: String(data.get("pix_key") ?? ""),
    });
  }

  function goTo(next: number) {
    syncPreview();
    setStep(Math.min(Math.max(next, 0), STEPS.length - 1));
  }

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="space-y-5">
      <ProductWizardSteps steps={STEPS} current={step} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Lock className="h-3 w-3" /> Ambiente protegido por SSL 256-bit
        </span>
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> Em conformidade com a LGPD
        </span>
        <a href={`mailto:${DPO_CONTACT_EMAIL}`} className="text-cc-orange hover:underline">
          Dúvidas sobre seus dados? Fale com nosso DPO
        </a>
      </div>

      <form ref={formRef} action={submitProducerApplication} onChange={syncPreview} className="space-y-6">
        <input type="hidden" name="applicant_type" value={applicantType} />

        <section hidden={step !== 0} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              name="cnpj"
              required
              inputMode="numeric"
              defaultValue={defaults?.cnpj}
              placeholder="00.000.000/0000-00"
              onInput={(e) => {
                e.currentTarget.value = formatCnpj(e.currentTarget.value);
              }}
              onBlur={handleCnpjBlur}
            />
            {cnpjLookup.loading ? (
              <p className="text-xs text-muted-foreground">Consultando Receita Federal…</p>
            ) : cnpjLookup.error ? (
              <p className="text-xs text-destructive">{cnpjLookup.error}</p>
            ) : cnpjLookup.cnae ? (
              <p className="text-xs text-muted-foreground">CNAE: {cnpjLookup.cnae}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="razao_social">Razão social</Label>
            <Input
              ref={razaoSocialRef}
              id="razao_social"
              name="razao_social"
              required
              defaultValue={defaults?.razaoSocial}
              placeholder="Nome oficial da empresa/cooperativa (preenchido automaticamente pelo CNPJ)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state_registration">Inscrição Estadual (opcional)</Label>
            <Input
              id="state_registration"
              name="state_registration"
              defaultValue={defaults?.stateRegistration}
              placeholder="Se isento, deixe em branco"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="responsavel_nome">Responsável</Label>
              <Input
                id="responsavel_nome"
                name="responsavel_nome"
                required
                defaultValue={defaults?.responsavelNome}
                placeholder="Nome de quem responde legalmente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsavel_telefone">Telefone do responsável</Label>
              <Input
                id="responsavel_telefone"
                name="responsavel_telefone"
                type="tel"
                required
                defaultValue={defaults?.responsavelTelefone}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contato_email">E-mail de contato comercial</Label>
            <Input
              id="contato_email"
              name="contato_email"
              type="email"
              required
              defaultValue={defaults?.contatoEmail}
              placeholder="contato@suaempresa.com"
            />
          </div>

          {applicantType === "produtor" ? (
            <div className="space-y-4 border-t border-border pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business_size">Porte do negócio</Label>
                  <Select name="business_size" defaultValue={defaults?.businessSize || "mei"}>
                    <SelectTrigger id="business_size" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_SIZE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="founded_year">Atua desde (ano)</Label>
                  <Input
                    id="founded_year"
                    name="founded_year"
                    type="number"
                    min="1900"
                    max="2100"
                    defaultValue={defaults?.foundedYear}
                    placeholder="Ex: 2021"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website_url">Site ou rede social (opcional)</Label>
                <Input
                  id="website_url"
                  name="website_url"
                  type="url"
                  defaultValue={defaults?.websiteUrl}
                  placeholder="https://instagram.com/seunegocio"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 border-t border-border pt-4">
              <fieldset className="space-y-2">
                <legend className="mb-1 text-sm font-medium text-cc-green">Tipo de resíduo coletado</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {WASTE_TYPE_OPTIONS.map((option, index) => (
                    <label
                      key={option.value}
                      className="group relative flex cursor-pointer flex-col gap-1 rounded-2xl border border-border bg-background p-3 text-sm transition-colors has-[:checked]:border-cc-orange has-[:checked]:bg-cc-cream/50"
                    >
                      <input
                        type="radio"
                        name="waste_type"
                        value={option.value}
                        defaultChecked={(defaults?.wasteType || "both") === option.value || (!defaults && index === 2)}
                        className="sr-only"
                        required
                      />
                      <span className="font-medium text-cc-green">{option.title}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="capacity_kg_day">Capacidade de coleta (kg/dia)</Label>
                  <Input
                    id="capacity_kg_day"
                    name="capacity_kg_day"
                    type="number"
                    min="0"
                    defaultValue={defaults?.capacityKgDay}
                    placeholder="Ex: 500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service_area">Área de atuação</Label>
                  <Input
                    id="service_area"
                    name="service_area"
                    required
                    defaultValue={defaults?.serviceArea}
                    placeholder="Ex: Zona Norte, Duque de Caxias"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        <section hidden={step !== 1} className="space-y-2">
          <Label>Endereço da sede/operação</Label>
          <CepAddressFields
            defaults={defaults?.businessAddress}
            autoFill={addressAutoFill ? { ...addressAutoFill, nonce: addressAutoFillNonce } : undefined}
          />
        </section>

        <section hidden={step !== 2} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sustainability_description">{copy.sustainability.label}</Label>
            <Textarea
              id="sustainability_description"
              name="sustainability_description"
              rows={4}
              required
              defaultValue={defaults?.sustainabilityDescription}
              placeholder={copy.sustainability.placeholder}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="material_origin">{copy.materialOrigin.label}</Label>
            <Textarea
              id="material_origin"
              name="material_origin"
              rows={3}
              required
              defaultValue={defaults?.materialOrigin}
              placeholder={copy.materialOrigin.placeholder}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="operation_description">{copy.operation.label}</Label>
            <Textarea
              id="operation_description"
              name="operation_description"
              rows={3}
              required
              defaultValue={defaults?.operationDescription}
              placeholder={copy.operation.placeholder}
            />
          </div>
        </section>

        <section hidden={step !== 3} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bank_name">Banco</Label>
            <Input
              id="bank_name"
              name="bank_name"
              required
              defaultValue={defaults?.bankName}
              placeholder="Ex: Banco do Brasil, Nubank, Sicoob..."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bank_account_type">Tipo de conta</Label>
              <Select name="bank_account_type" defaultValue={defaults?.bankAccountType || "corrente"}>
                <SelectTrigger id="bank_account_type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BANK_ACCOUNT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_agency">Agência</Label>
              <Input id="bank_agency" name="bank_agency" required defaultValue={defaults?.bankAgency} placeholder="0000" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank_account">Conta com dígito</Label>
            <Input
              id="bank_account"
              name="bank_account"
              required
              defaultValue={defaults?.bankAccount}
              placeholder="00000-0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pix_key">Chave Pix (associada ao CNPJ)</Label>
            <Input id="pix_key" name="pix_key" required defaultValue={defaults?.pixKey} placeholder="CNPJ, e-mail, telefone ou aleatória" />
            {(() => {
              const pixDigits = preview.pix_key.replace(/\D/g, "");
              const cnpjDigits = preview.cnpj.replace(/\D/g, "");
              const looksLikeCnpj = pixDigits.length === 14;
              if (looksLikeCnpj && cnpjDigits && pixDigits !== cnpjDigits) {
                return (
                  <p className="rounded-lg bg-destructive/5 p-2 text-xs text-destructive">
                    Essa chave Pix parece ser um CNPJ diferente do informado no cadastro. Confira antes de
                    enviar — repasses só saem para conta no mesmo CNPJ.
                  </p>
                );
              }
              return null;
            })()}
          </div>
          <p className="rounded-lg bg-muted/20 p-2.5 text-xs text-muted-foreground">
            🔒 Esses dados são usados exclusivamente para configurar os repasses financeiros das suas
            vendas e ficam visíveis só para você e para a curadoria.
          </p>
        </section>

        <section hidden={step !== 4} className="space-y-2">
          <Label>Documentos comprobatórios</Label>
          <p className="text-xs text-muted-foreground">
            {applicantType === "produtor"
              ? "Certificações, licenças (quando aplicável) e fotos da operação."
              : "Licença/autorização ambiental, CNPJ, fotos da estrutura de triagem."}{" "}
            Ficam visíveis só para você e para a curadoria.
          </p>
          <ProducerDocumentInput userId={userId} initialDocuments={documents} />
        </section>

        <section hidden={step !== 5} className="space-y-3">
          <dl className="space-y-2 rounded-xl border border-border bg-muted/20 p-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">CNPJ</dt>
              <dd className="text-cc-green">{preview.cnpj || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Chave Pix</dt>
              <dd className="text-cc-green">{preview.pix_key || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Razão social</dt>
              <dd className="text-cc-green">{preview.razao_social || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Responsável</dt>
              <dd className="text-cc-green">{preview.responsavel_nome || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{copy.sustainability.label}</dt>
              <dd className="whitespace-pre-line text-cc-green">{preview.sustainability_description || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{copy.materialOrigin.label}</dt>
              <dd className="whitespace-pre-line text-cc-green">{preview.material_origin || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{copy.operation.label}</dt>
              <dd className="whitespace-pre-line text-cc-green">{preview.operation_description || "—"}</dd>
            </div>
          </dl>

          <label className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              name="partner_terms_accepted"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              required
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-cc-orange"
            />
            <span>
              Declaro que as informações enviadas são verdadeiras e aceito as responsabilidades de parceiro
              descritas nos{" "}
              <Link href="/termos" target="_blank" className="font-medium text-cc-orange hover:underline">
                Termos de Uso
              </Link>
              .
            </span>
          </label>

          <p className="text-xs text-muted-foreground">
            Ao enviar, sua candidatura entra (ou volta) para análise da curadoria.
          </p>
        </section>

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => goTo(step - 1)} disabled={step === 0}>
            Voltar
          </Button>
          {isLastStep ? (
            <SubmitButton disabled={!termsAccepted}>Enviar para análise</SubmitButton>
          ) : (
            <Button type="button" onClick={() => goTo(step + 1)}>
              Próximo
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
