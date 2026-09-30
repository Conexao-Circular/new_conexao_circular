import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { FormError } from "@/components/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProducerApplicationWizard } from "@/components/producer-application-wizard";
import { createClient } from "@/lib/supabase/server";
import { PRODUCER_APPLICATION_STATUS_LABELS } from "@/lib/labels";
import { isDocumentType, type ApplicantType } from "@/lib/producer-application";

export default async function CadastroParceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; enviado?: string }>;
}) {
  const { error, enviado } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "produtor" && profile.role !== "cooperativa")) {
    redirect("/inicio");
  }

  const { data: application } = await supabase
    .from("producer_applications")
    .select(
      "id, applicant_type, cnpj, razao_social, responsavel_nome, responsavel_telefone, contato_email, business_address, business_size, founded_year, website_url, state_registration, waste_type, capacity_kg_day, service_area, sustainability_description, material_origin, operation_description, bank_name, bank_account_type, bank_agency, bank_account, pix_key, status, review_note, partner_terms_accepted_at",
    )
    .eq("profile_id", user.id)
    .maybeSingle();

  let documents: { path: string; documentType: "certificacao" | "licenca" | "foto_operacao" | "outro"; label: string; fileName: string }[] = [];
  if (application) {
    const { data: docRows } = await supabase
      .from("producer_application_documents")
      .select("file_path, document_type, label")
      .eq("application_id", application.id);

    documents = (docRows ?? [])
      .filter((d) => isDocumentType(d.document_type))
      .map((d) => ({
        path: d.file_path,
        documentType: d.document_type as "certificacao" | "licenca" | "foto_operacao" | "outro",
        label: d.label ?? "",
        fileName: d.file_path.split("/").pop() ?? d.file_path,
      }));
  }

  const applicantType: ApplicantType =
    application?.applicant_type ?? (profile.role === "cooperativa" ? "cooperativa" : "produtor");
  const businessAddress = (application?.business_address as Record<string, string> | null) ?? null;

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold text-cc-green">Cadastro de Produtor Circular</h1>
        <p className="text-sm text-muted-foreground">
          Conte sobre o seu negócio ou cooperativa para nossa curadoria avaliar. O acesso completo à
          plataforma (loja, coletas) só libera depois da aprovação — quanto mais completo, mais rápida a
          análise.
        </p>
      </header>

      {application && (
        <Card
          className={
            application.status === "approved"
              ? "border-cc-green"
              : application.status === "rejected"
                ? "border-destructive"
                : "border-cc-orange"
          }
        >
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            {application.status === "approved" ? (
              <CheckCircle2 className="h-5 w-5 text-cc-green" />
            ) : application.status === "rejected" ? (
              <XCircle className="h-5 w-5 text-destructive" />
            ) : application.status === "docs_pending" ? (
              <AlertTriangle className="h-5 w-5 text-cc-orange" />
            ) : (
              <Clock3 className="h-5 w-5 text-cc-orange" />
            )}
            <CardTitle className="text-sm">
              Status:{" "}
              <Badge
                variant={
                  application.status === "approved"
                    ? "default"
                    : application.status === "rejected"
                      ? "destructive"
                      : application.status === "docs_pending"
                        ? "outline"
                        : "secondary"
                }
              >
                {PRODUCER_APPLICATION_STATUS_LABELS[application.status] ?? application.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {application.status === "pending" && (
              <p>Sua candidatura está com a curadoria. Avisamos por push quando sair o resultado.</p>
            )}
            {application.status === "approved" && (
              <p>
                Seu cadastro de Produtor Circular foi aprovado — a plataforma já está liberada pra você.
              </p>
            )}
            {application.status === "docs_pending" && (
              <>
                <p>A curadoria precisa de mais alguma coisa antes de aprovar. Ajuste os dados abaixo e reenvie.</p>
                {application.review_note && (
                  <p className="rounded-lg bg-destructive/5 p-2 text-destructive">{application.review_note}</p>
                )}
              </>
            )}
            {application.status === "rejected" && (
              <>
                <p>Sua candidatura não foi aprovada desta vez. Ajuste os dados abaixo e reenvie.</p>
                {application.review_note && (
                  <p className="rounded-lg bg-destructive/5 p-2 text-destructive">{application.review_note}</p>
                )}
              </>
            )}
            {application.status === "approved" && (
              <Button asChild variant="outline" size="sm">
                <Link href="/onboarding/plano">
                  Continuar para escolha de plano <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {enviado === "1" && !error && (
        <p className="rounded-lg border border-cc-green/30 bg-cc-green/5 p-3 text-sm text-cc-green">
          Candidatura enviada com sucesso.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{application ? "Editar candidatura" : "Dados do Produtor Circular"}</CardTitle>
        </CardHeader>
        <CardContent>
          <FormError message={error} />
          <ProducerApplicationWizard
            userId={user.id}
            documents={documents}
            applicantType={applicantType}
            defaults={
              application
                ? {
                    cnpj: application.cnpj,
                    razaoSocial: application.razao_social,
                    responsavelNome: application.responsavel_nome,
                    responsavelTelefone: application.responsavel_telefone ?? "",
                    contatoEmail: application.contato_email ?? "",
                    businessAddress: businessAddress ?? undefined,
                    businessSize: application.business_size ?? "",
                    foundedYear: application.founded_year ? String(application.founded_year) : "",
                    websiteUrl: application.website_url ?? "",
                    stateRegistration: application.state_registration ?? "",
                    wasteType: application.waste_type ?? "both",
                    capacityKgDay: application.capacity_kg_day ? String(application.capacity_kg_day) : "",
                    serviceArea: application.service_area ?? "",
                    sustainabilityDescription: application.sustainability_description,
                    materialOrigin: application.material_origin,
                    operationDescription: application.operation_description,
                    bankName: application.bank_name ?? "",
                    bankAccountType: application.bank_account_type ?? "",
                    bankAgency: application.bank_agency ?? "",
                    bankAccount: application.bank_account ?? "",
                    pixKey: application.pix_key ?? "",
                    partnerTermsAccepted: !!application.partner_terms_accepted_at,
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
