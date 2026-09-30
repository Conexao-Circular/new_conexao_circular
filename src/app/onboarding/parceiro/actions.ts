"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDocumentType, isApplicantType } from "@/lib/producer-application";

type ParsedDocument = { path: string; document_type: string; label: string | null };

function parseDocuments(formData: FormData, userId: string): ParsedDocument[] {
  const prefix = `${userId}/`;
  const docs: ParsedDocument[] = [];

  for (const raw of formData.getAll("documents")) {
    if (typeof raw !== "string") continue;
    try {
      const parsed = JSON.parse(raw) as { path?: unknown; document_type?: unknown; label?: unknown };
      if (
        typeof parsed.path === "string" &&
        parsed.path.startsWith(prefix) &&
        typeof parsed.document_type === "string" &&
        isDocumentType(parsed.document_type)
      ) {
        docs.push({
          path: parsed.path,
          document_type: parsed.document_type,
          label: typeof parsed.label === "string" && parsed.label.trim() ? parsed.label.trim() : null,
        });
      }
    } catch {
      // ignore malformed entries
    }
  }

  return docs;
}

function parseBusinessAddress(formData: FormData) {
  const zip = String(formData.get("address_zip") ?? "").replace(/\D/g, "");
  const street = String(formData.get("address_street") ?? "").trim();
  const number = String(formData.get("address_number") ?? "").trim();
  const city = String(formData.get("address_city") ?? "").trim();
  const state = String(formData.get("address_state") ?? "").trim();

  if (!zip || !street || !number || !city || !state) return null;

  return {
    zip,
    street,
    number,
    complement: (String(formData.get("address_complement") ?? "").trim() || null) as string | null,
    neighborhood: String(formData.get("address_neighborhood") ?? "").trim(),
    city,
    state,
    reference: (String(formData.get("address_reference") ?? "").trim() || null) as string | null,
  };
}

export async function submitProducerApplication(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "produtor" && profile.role !== "cooperativa")) {
    redirect("/inicio");
  }

  const applicantTypeRaw = String(formData.get("applicant_type") ?? "");
  const applicantType = isApplicantType(applicantTypeRaw)
    ? applicantTypeRaw
    : profile.role === "cooperativa"
      ? "cooperativa"
      : "produtor";

  const cnpj = String(formData.get("cnpj") ?? "").trim();
  const razaoSocial = String(formData.get("razao_social") ?? "").trim();
  const responsavelNome = String(formData.get("responsavel_nome") ?? "").trim();
  const responsavelTelefone = String(formData.get("responsavel_telefone") ?? "").trim() || null;
  const contatoEmail = String(formData.get("contato_email") ?? "").trim() || null;
  const stateRegistration = String(formData.get("state_registration") ?? "").trim() || null;
  const sustainabilityDescription = String(formData.get("sustainability_description") ?? "").trim();
  const materialOrigin = String(formData.get("material_origin") ?? "").trim();
  const operationDescription = String(formData.get("operation_description") ?? "").trim();
  const partnerTermsAccepted = formData.get("partner_terms_accepted") === "on";
  const businessAddress = parseBusinessAddress(formData);

  const businessSize = String(formData.get("business_size") ?? "").trim() || null;
  const foundedYearRaw = String(formData.get("founded_year") ?? "").trim();
  const foundedYear = foundedYearRaw ? Number(foundedYearRaw) : null;
  const websiteUrl = String(formData.get("website_url") ?? "").trim() || null;

  const bankName = String(formData.get("bank_name") ?? "").trim();
  const bankAccountTypeRaw = String(formData.get("bank_account_type") ?? "").trim();
  const BANK_ACCOUNT_TYPES = ["corrente", "pagamentos"] as const;
  const bankAccountType = (BANK_ACCOUNT_TYPES as readonly string[]).includes(bankAccountTypeRaw)
    ? (bankAccountTypeRaw as (typeof BANK_ACCOUNT_TYPES)[number])
    : null;
  const bankAgency = String(formData.get("bank_agency") ?? "").trim();
  const bankAccount = String(formData.get("bank_account") ?? "").trim();
  const pixKey = String(formData.get("pix_key") ?? "").trim();

  const wasteTypeRaw = String(formData.get("waste_type") ?? "").trim();
  const WASTE_TYPES = ["organic", "solid", "both"] as const;
  const wasteType = (WASTE_TYPES as readonly string[]).includes(wasteTypeRaw)
    ? (wasteTypeRaw as (typeof WASTE_TYPES)[number])
    : null;
  const capacityKgDayRaw = String(formData.get("capacity_kg_day") ?? "").trim();
  const capacityKgDay = capacityKgDayRaw ? Number(capacityKgDayRaw) : null;
  const serviceArea = String(formData.get("service_area") ?? "").trim() || null;

  const missingShared =
    !cnpj ||
    !razaoSocial ||
    !responsavelNome ||
    !responsavelTelefone ||
    !contatoEmail ||
    !sustainabilityDescription ||
    !materialOrigin ||
    !operationDescription ||
    !businessAddress ||
    !bankName ||
    !bankAccountType ||
    !bankAgency ||
    !bankAccount ||
    !pixKey;
  const missingTypeSpecific = applicantType === "cooperativa" ? !wasteType || !serviceArea : false;

  if (missingShared || missingTypeSpecific) {
    redirect("/onboarding/parceiro?error=" + encodeURIComponent("Preencha todos os campos obrigatórios."));
  }

  if (!partnerTermsAccepted) {
    redirect(
      "/onboarding/parceiro?error=" +
        encodeURIComponent("Você precisa aceitar as responsabilidades de parceiro para enviar."),
    );
  }

  const { data: application, error: upsertError } = await supabase
    .from("producer_applications")
    .upsert(
      {
        profile_id: user.id,
        applicant_type: applicantType,
        cnpj,
        razao_social: razaoSocial,
        responsavel_nome: responsavelNome,
        responsavel_telefone: responsavelTelefone,
        contato_email: contatoEmail,
        state_registration: stateRegistration,
        business_address: businessAddress,
        business_size: applicantType === "produtor" ? businessSize : null,
        founded_year: applicantType === "produtor" ? foundedYear : null,
        website_url: applicantType === "produtor" ? websiteUrl : null,
        waste_type: applicantType === "cooperativa" ? wasteType : null,
        capacity_kg_day: applicantType === "cooperativa" ? capacityKgDay : null,
        service_area: applicantType === "cooperativa" ? serviceArea : null,
        sustainability_description: sustainabilityDescription,
        material_origin: materialOrigin,
        operation_description: operationDescription,
        bank_name: bankName,
        bank_account_type: bankAccountType,
        bank_agency: bankAgency,
        bank_account: bankAccount,
        pix_key: pixKey,
        status: "pending",
        partner_terms_accepted_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" },
    )
    .select("id")
    .single();

  if (upsertError || !application) {
    redirect("/onboarding/parceiro?error=" + encodeURIComponent("Não foi possível salvar. Tente novamente."));
  }

  const documents = parseDocuments(formData, user.id);

  await supabase.from("producer_application_documents").delete().eq("application_id", application.id);
  if (documents.length > 0) {
    await supabase.from("producer_application_documents").insert(
      documents.map((doc) => ({
        application_id: application.id,
        document_type: doc.document_type,
        file_path: doc.path,
        label: doc.label,
      })),
    );
  }

  redirect("/onboarding/parceiro?enviado=1");
}
