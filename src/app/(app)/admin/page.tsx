import { redirect } from "next/navigation";
import { evaluatePartnerTier, networkGap } from "@/lib/partner-tier";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../inicio/actions";
import { Button } from "@/components/ui/button";
import { AdminPanel } from "./admin-panel";

const METRICS_PERIODS = [7, 30, 90];

const CURATION_STATUSES = ["pending", "docs_pending", "approved", "rejected", "all"] as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; periodo?: string; curadoria?: string }>;
}) {
  const { aba, periodo, curadoria } = await searchParams;
  const days = METRICS_PERIODS.includes(Number(periodo)) ? Number(periodo) : 30;
  const curationStatus = CURATION_STATUSES.includes(curadoria as (typeof CURATION_STATUSES)[number])
    ? (curadoria as (typeof CURATION_STATUSES)[number])
    : "pending";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: isAdmin, error: isAdminError } = await supabase.rpc("is_admin");
  if (isAdminError || !isAdmin) redirect("/inicio");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/inicio");

  const [
    { count: totalUsers },
    { count: payingUsers },
    { count: consumerProducerCount },
    { count: activeCooperatives },
    { count: pendingApprovals },
    { count: pendingCuration },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .in("role", ["consumidor", "produtor"]),
    supabase
      .from("cooperatives")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("approval_status", "pending"),
    supabase
      .from("producer_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const freeUsers = Math.max(0, (consumerProducerCount ?? 0) - (payingUsers ?? 0));

  const [
    { data: users },
    { data: pendingUsers },
    { data: cooperatives },
    { data: applications },
    { data: products },
    { data: subscriptions },
    { data: salesSummaryRows },
    { data: salesDailyRows },
    { data: topProducts },
    { data: tierMetrics },
    { data: tierSampleRows },
    { data: agentCourseRows },
    { data: agentReferralRows },
    { data: agentEvidenceRows },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, name, email, role, phone, created_at, approval_status, approved_at, access_override, lifetime_points, points_balance, streak_weeks, referral_code, referred_by, agent_status, agent_code, agent_slug, agent_is_available, agent_interests, agent_neighborhood, agent_city, agent_bio, agent_course, agent_practical_mission, agent_practical_mission_status, agent_certificate_url",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, name, email, role, phone, created_at")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("cooperatives")
      .select(
        "id, name, type, status, contact_name, contact_phone, collects_description, operation_description",
      )
      .order("created_at", { ascending: false }),
    (() => {
      let query = supabase
        .from("producer_applications")
        .select(
          "id, profile_id, applicant_type, cnpj, razao_social, responsavel_nome, responsavel_telefone, contato_email, business_address, business_size, founded_year, website_url, state_registration, waste_type, capacity_kg_day, service_area, sustainability_description, material_origin, operation_description, bank_name, bank_account_type, bank_agency, bank_account, pix_key, status, review_note, submitted_at",
        )
        .order("submitted_at", { ascending: true });
      if (curationStatus !== "all") query = query.eq("status", curationStatus);
      return query;
    })(),
    supabase
      .from("products")
      .select("id, name, category, price_cents, status, description")
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("id, profile_id, status, plans(name)")
      .in("status", ["active", "pending"]),
    supabase.rpc("admin_sales_summary", { p_days: days }),
    supabase.rpc("admin_sales_daily", { p_days: days }),
    supabase.rpc("admin_top_products", { p_days: days, p_limit: 10 }),
    supabase.rpc("get_partner_tier_metrics"),
    supabase.rpc("get_partner_tier_network_sample"),
    supabase
      .from("agent_course_progress")
      .select("id, agent_id, course_slug, status, progress_percent, started_at, completed_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase
      .from("agent_referrals")
      .select("id, agent_id, referral_type, name, responsible_name, contact, neighborhood, city, reason, observed_practice, referral_code, referred_user_id, referred_email, status, referred_at, converted_at, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("agent_evidences")
      .select(
        "id, agent_id, referral_id, evidence_type, file_path, file_name, content_type, title, description, observation, status, reviewed_by, reviewed_at, review_note, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  // O tier acima de "Verificado" é decidido em src/lib/partner-tier.ts, aqui no
  // servidor. Com a rede pequena, `awarded` volta false para todo mundo — o
  // painel existe justamente para acompanhar a distância até a trava cair.
  const tierSample = {
    verifiedPartners: tierSampleRows?.[0]?.verified_partners ?? 0,
    deliveredOrders: tierSampleRows?.[0]?.delivered_orders ?? 0,
  };
  const partnerTiers = (tierMetrics ?? []).map((row) => {
    const metrics = {
      deliveredOrders: row.delivered_orders,
      gmvCents: row.gmv_cents,
      reviewsCount: row.reviews_count,
      averageRating: row.avg_rating,
      activeDays: row.active_days,
    };
    return {
      partnerId: row.partner_id,
      name: row.store_name ?? row.name,
      metrics,
      evaluation: evaluatePartnerTier(metrics, tierSample),
    };
  });

  const applicantIds = (applications ?? []).map((a) => a.profile_id);
  const { data: applicants } = applicantIds.length
    ? await supabase.from("profiles").select("id, name, email").in("id", applicantIds)
    : { data: [] };
  const applicantMap = new Map((applicants ?? []).map((p) => [p.id, p]));

  const applicationIds = (applications ?? []).map((a) => a.id);
  const { data: applicationDocs } = applicationIds.length
    ? await supabase
        .from("producer_application_documents")
        .select("id, application_id, document_type, label, file_path")
        .in("application_id", applicationIds)
    : { data: [] };

  const docsByApplication = new Map<
    string,
    { id: string; documentType: string; label: string | null; url: string | null }[]
  >();
  await Promise.all(
    (applicationDocs ?? []).map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from("producer-documents")
        .createSignedUrl(doc.file_path, 3600);
      const list = docsByApplication.get(doc.application_id) ?? [];
      list.push({
        id: doc.id,
        documentType: doc.document_type,
        label: doc.label,
        url: signed?.signedUrl ?? null,
      });
      docsByApplication.set(doc.application_id, list);
    }),
  );

  const producerApplications = (applications ?? []).map((a) => ({
    id: a.id,
    profileId: a.profile_id,
    applicantType: a.applicant_type,
    name: applicantMap.get(a.profile_id)?.name ?? "—",
    email: applicantMap.get(a.profile_id)?.email ?? "—",
    cnpj: a.cnpj,
    razaoSocial: a.razao_social,
    responsavelNome: a.responsavel_nome,
    responsavelTelefone: a.responsavel_telefone,
    contatoEmail: a.contato_email,
    businessAddress: a.business_address as Record<string, string> | null,
    businessSize: a.business_size,
    foundedYear: a.founded_year,
    websiteUrl: a.website_url,
    stateRegistration: a.state_registration,
    wasteType: a.waste_type,
    capacityKgDay: a.capacity_kg_day,
    serviceArea: a.service_area,
    sustainabilityDescription: a.sustainability_description,
    materialOrigin: a.material_origin,
    operationDescription: a.operation_description,
    bankName: a.bank_name,
    bankAccountType: a.bank_account_type,
    bankAgency: a.bank_agency,
    bankAccount: a.bank_account,
    pixKey: a.pix_key,
    status: a.status,
    reviewNote: a.review_note,
    submittedAt: a.submitted_at,
    documents: docsByApplication.get(a.id) ?? [],
  }));

  const profileMap = new Map((users ?? []).map((userRow) => [userRow.id, userRow]));
  const referralCountByAgent = new Map<string, number>();
  const completedMissionCountByAgent = new Map<string, number>();

  for (const referral of agentReferralRows ?? []) {
    referralCountByAgent.set(
      referral.agent_id,
      (referralCountByAgent.get(referral.agent_id) ?? 0) + 1,
    );
  }

  for (const mission of agentCourseRows ?? []) {
    if (mission.status === "completed") {
      completedMissionCountByAgent.set(
        mission.agent_id,
        (completedMissionCountByAgent.get(mission.agent_id) ?? 0) + 1,
      );
    }
  }

  const circularAgents = (users ?? [])
    .filter((agent) => agent.role === "agent_circular" || agent.agent_status !== null)
    .map((agent) => ({
      id: agent.id,
      name: agent.name,
      email: agent.email,
      role: agent.role,
      agentStatus: agent.agent_status ?? "pending",
      agentCode: agent.agent_code,
      agentIsAvailable: agent.agent_is_available,
      agentCity: agent.agent_city,
      agentNeighborhood: agent.agent_neighborhood,
      agentInterests: agent.agent_interests,
      agentBio: agent.agent_bio,
      agentCourse: agent.agent_course,
      agentPracticalMission: agent.agent_practical_mission,
      agentMissionStatus: agent.agent_practical_mission_status,
      agentCertificateUrl: agent.agent_certificate_url,
      createdAt: agent.created_at,
      lifetimePoints: agent.lifetime_points,
      pointsBalance: agent.points_balance,
      streakWeeks: agent.streak_weeks,
      referralCode: agent.referral_code,
      referralCount: referralCountByAgent.get(agent.id) ?? 0,
      completedMissionCount: completedMissionCountByAgent.get(agent.id) ?? 0,
    }));

  const circularMissions = circularAgents
    .filter((agent) => agent.agentPracticalMission)
    .map((agent) => {
      let missionTitle = "Missão prática";
      try {
        const parsed = JSON.parse(agent.agentPracticalMission ?? "{}");
        if (typeof parsed.title === "string") missionTitle = parsed.title;
      } catch {
        missionTitle = "Missão prática";
      }
      return {
        id: agent.id,
        agentId: agent.id,
        agentName: agent.name,
        courseSlug: missionTitle,
        status: agent.agentMissionStatus ?? "submitted",
        progressPercent: 100,
        startedAt: agent.createdAt,
        completedAt: agent.agentMissionStatus === "approved" ? agent.createdAt : null,
        updatedAt: agent.createdAt,
      };
    });

  const circularReferrals = (agentReferralRows ?? []).map((referral) => ({
    id: referral.id,
    agentName: profileMap.get(referral.agent_id)?.name ?? "Agente não encontrado",
    referredName: referral.name ?? (referral.referred_user_id
      ? (profileMap.get(referral.referred_user_id)?.name ?? null)
      : null),
    referredEmail: referral.contact ?? referral.referred_email,
    referralCode: referral.referral_code,
    status: referral.status,
    createdAt: referral.created_at,
    referredAt: referral.referred_at,
    convertedAt: referral.converted_at,
  }));

  const circularEvidence = await Promise.all(
    (agentEvidenceRows ?? []).map(async (evidence) => {
      const { data: signed } = await supabase.storage
        .from("agent-evidences")
        .createSignedUrl(evidence.file_path, 3600);
      return {
        id: evidence.id,
        agentName: profileMap.get(evidence.agent_id)?.name ?? "Agente não encontrado",
        type: evidence.evidence_type,
        title: evidence.title,
        description: evidence.description ?? evidence.observation,
        url: signed?.signedUrl ?? null,
        status: evidence.status,
        reviewNote: evidence.review_note,
        createdAt: evidence.created_at,
      };
    }),
  );

  const salesSummary = salesSummaryRows?.[0] ?? {
    gmv_cents: 0,
    orders_count: 0,
    avg_ticket_cents: 0,
    mrr_cents: 0,
    prev_gmv_cents: 0,
    prev_orders_count: 0,
  };

  const subscriptionMap: Record<string, string> = {};
  const pendingSubscriptionMap: Record<string, { id: string; planName: string }> = {};
  for (const sub of subscriptions ?? []) {
    const planName =
      sub.plans && typeof sub.plans === "object" && "name" in sub.plans
        ? (sub.plans as { name: string }).name
        : "";
    if (sub.status === "active") {
      subscriptionMap[sub.profile_id] = planName;
    } else if (sub.status === "pending") {
      pendingSubscriptionMap[sub.profile_id] = { id: sub.id, planName };
    }
  }

  return (
    <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Painel</p>
          <h1 className="font-heading text-2xl font-semibold text-cc-green">Administração</h1>
        </div>
        <form action={logout}>
          <Button type="submit" variant="outline" size="sm">
            Sair
          </Button>
        </form>
      </header>

      <AdminPanel
        metrics={{
          totalUsers: totalUsers ?? 0,
          payingUsers: payingUsers ?? 0,
          freeUsers,
          activeCooperatives: activeCooperatives ?? 0,
          pendingApprovals: pendingApprovals ?? 0,
          pendingCuration: pendingCuration ?? 0,
        }}
        users={users ?? []}
        pendingUsers={pendingUsers ?? []}
        cooperatives={cooperatives ?? []}
        producerApplications={producerApplications}
        curationStatus={curationStatus}
        products={products ?? []}
        subscriptionMap={subscriptionMap}
        pendingSubscriptionMap={pendingSubscriptionMap}
        defaultTab={
          aba === "agentes"
            ? "agentes"
            : aba === "aprovacoes"
              ? "aprovacoes"
              : aba === "metricas"
                ? "metricas"
                : "usuarios"
        }
        circularReview={{
          agents: circularAgents,
          missions: circularMissions,
          referrals: circularReferrals,
          evidence: circularEvidence,
        }}
        partnerTier={{
          sample: tierSample,
          gap: networkGap(tierSample),
          partners: partnerTiers,
        }}
        sales={{
          days,
          summary: salesSummary,
          daily: (salesDailyRows ?? []).map((row) => ({ day: row.day, gmvCents: row.gmv_cents })),
          topProducts: topProducts ?? [],
        }}
      />
    </div>
  );
}
