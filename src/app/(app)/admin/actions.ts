"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parsePriceToCents } from "@/lib/pricing";
import { notifyProfile } from "@/lib/push";
import { sendPartnerCurationEmail } from "@/lib/email";
import type { Database } from "@/lib/supabase/types";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) redirect("/inicio");
  return supabase;
}

type CircularReviewDecision = "approved" | "rejected";

function readCircularReview(formData: FormData) {
  const id = formData.get("id");
  const decision = formData.get("decision");

  if (typeof id !== "string" || !id || (decision !== "approved" && decision !== "rejected")) {
    return null;
  }

  return { id, decision: decision as CircularReviewDecision };
}

function agentStatusUpdate(decision: CircularReviewDecision) {
  return {
    agent_status: decision === "approved" ? "approved" : "suspended",
  };
}

export async function reviewCircularAgent(formData: FormData) {
  const supabase = await requireAdmin();
  const review = readCircularReview(formData);
  if (!review) return;

  const { data: profile } = await supabase
    .from("profiles")
    .update(agentStatusUpdate(review.decision))
    .eq("id", review.id)
    .eq("role", "agent_circular")
    .select("id")
    .maybeSingle();

  if (profile && review.decision === "approved") {
    await notifyProfile(profile.id, {
      title: "Cadastro aprovado! 🎉",
      body: "Sua conta foi liberada. Você tem 7 dias grátis para usar a Conexão Circular.",
      url: "/inicio",
    });
  }

  revalidatePath("/admin");
}

export async function reviewCircularReferral(formData: FormData) {
  const supabase = await requireAdmin();
  const review = readCircularReview(formData);
  if (!review) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: referral } = await supabase
    .from("agent_referrals")
    .select("id")
    .eq("id", review.id)
    .in("status", ["indicated", "review", "pending"])
    .maybeSingle();
  if (!referral) return;

  await supabase
    .from("agent_referrals")
    .update({
      status: review.decision === "approved" ? "approved" : "rejected",
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", review.id)
    .in("status", ["indicated", "review", "pending"]);

  revalidatePath("/admin");
}

export async function reviewCircularMission(formData: FormData) {
  const supabase = await requireAdmin();
  const review = readCircularReview(formData);
  if (!review) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: agent } = await supabase
    .from("profiles")
    .select("id, role, agent_practical_mission_status, agent_rules_accepted_at")
    .eq("id", review.id)
    .eq("role", "agent_circular")
    .in("agent_practical_mission_status", ["submitted", "under_review"])
    .maybeSingle();
  if (!agent) return;

  let courseCount = 0;
  const { count } = await supabase
    .from("agent_course_progress")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", review.id)
    .eq("quiz_passed", true);
  courseCount = count ?? 0;
  const now = new Date().toISOString();
  const certificateCode = courseCount >= 6 && agent.agent_rules_accepted_at
    ? `AC-${review.id.replaceAll("-", "").slice(0, 10).toUpperCase()}`
    : null;

  const { data: mission } = await supabase
    .from("profiles")
    .update({
      agent_practical_mission_status: review.decision === "approved" ? "approved" : "rejected",
      agent_practical_mission_reviewed_by: user.id,
      agent_practical_mission_reviewed_at: now,
      agent_practical_mission_feedback: (formData.get("review_note") as string) || null,
      agent_status: review.decision === "approved" ? (certificateCode ? "active" : "approved") : "evaluation_pending",
      agent_certificate_code: certificateCode,
      agent_certificate_issued_at: certificateCode ? now : null,
    })
    .eq("id", review.id)
    .select("id")
    .maybeSingle();

  if (mission && review.decision === "approved") {
    await notifyProfile(mission.id, {
      title: "Missão prática aprovada ✅",
      body: certificateCode ? "Sua certificação está ativa." : "Sua missão foi aprovada; a equipe concluirá sua ativação.",
      url: "/agente/painel",
    });
  }

  revalidatePath("/admin");
  revalidatePath("/inicio");
}

export async function reviewCircularEvidence(formData: FormData) {
  const supabase = await requireAdmin();
  const review = readCircularReview(formData);
  if (!review) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("agent_evidences")
    .update({
      status: review.decision === "approved" ? "verified" : "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_note: (formData.get("review_note") as string) || null,
    })
    .eq("id", review.id)
    .in("status", ["uploaded", "under_review", "pending"]);

  revalidatePath("/admin");
  revalidatePath("/inicio");
}

export async function updateUser(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const phone = (formData.get("phone") as string) || null;
  const role = formData.get("role") as Database["public"]["Enums"]["user_role"];

  await supabase.from("profiles").update({ name, phone, role }).eq("id", id);
  revalidatePath("/admin");
}

export async function toggleCooperativeStatus(id: string, currentStatus: string) {
  const supabase = await requireAdmin();
  const newStatus: Database["public"]["Enums"]["cooperative_status"] =
    currentStatus === "active" ? "inactive" : "active";
  await supabase.from("cooperatives").update({ status: newStatus }).eq("id", id);
  revalidatePath("/admin");
}

export async function updateCooperative(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get("id") as string;
  const collectsDescription = (formData.get("collects_description") as string) || null;
  const operationDescription = (formData.get("operation_description") as string) || null;

  await supabase
    .from("cooperatives")
    .update({
      collects_description: collectsDescription,
      operation_description: operationDescription,
    })
    .eq("id", id);

  revalidatePath("/admin");
}

export async function approveUser(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get("id") as string;

  const { data: profile } = await supabase
    .from("profiles")
    .update({ approval_status: "approved", approved_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .single();

  if (profile) {
    await notifyProfile(profile.id, {
      title: "Cadastro aprovado! 🎉",
      body: "Sua conta foi liberada. Você tem 7 dias grátis para usar a Conexão Circular.",
      url: "/inicio",
    });
  }

  revalidatePath("/admin");
}

export async function rejectUser(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get("id") as string;

  await supabase.from("profiles").update({ approval_status: "rejected" }).eq("id", id);

  revalidatePath("/admin");
}

export async function activateSubscription(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get("id") as string;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .update({ status: "active", started_at: new Date().toISOString() })
    .eq("id", id)
    .select("profile_id, plans(name)")
    .single();

  if (subscription) {
    const planName =
      subscription.plans && typeof subscription.plans === "object" && "name" in subscription.plans
        ? (subscription.plans as { name: string }).name
        : "seu plano";
    await notifyProfile(subscription.profile_id, {
      title: "Pagamento confirmado ✅",
      body: `Assinatura do plano ${planName} ativada. Acesso total liberado.`,
      url: "/inicio",
    });
  }

  revalidatePath("/admin");
}

const CURATION_NOTIFICATIONS: Record<
  "approved" | "rejected" | "docs_pending",
  { title: string; fallbackBody: string }
> = {
  approved: {
    title: "Perfil de parceiro aprovado! 🎉",
    fallbackBody: "Sua loja agora é um parceiro verificado da Conexão Circular.",
  },
  rejected: {
    title: "Candidatura de parceiro reprovada",
    fallbackBody: "Revise os dados enviados e tente novamente.",
  },
  docs_pending: {
    title: "Falta documentação na sua candidatura",
    fallbackBody: "A curadoria pediu mais informações — confira o que falta e reenvie.",
  },
};

export async function reviewProducerApplication(formData: FormData) {
  const supabase = await requireAdmin();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const id = formData.get("id") as string;
  const decision = formData.get("decision") as "approved" | "rejected" | "docs_pending";
  const reviewNote = (formData.get("review_note") as string) || null;

  const { data: application } = await supabase
    .from("producer_applications")
    .update({
      status: decision,
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
      review_note: decision === "approved" ? null : reviewNote,
    })
    .eq("id", id)
    .select("profile_id, profiles(email)")
    .single();

  if (application) {
    const notification = CURATION_NOTIFICATIONS[decision];
    await notifyProfile(application.profile_id, {
      title: notification.title,
      body: reviewNote ?? notification.fallbackBody,
      url: "/onboarding/parceiro",
    });

    const partnerEmail =
      application.profiles &&
      typeof application.profiles === "object" &&
      "email" in application.profiles
        ? (application.profiles as { email: string }).email
        : null;
    if (partnerEmail) {
      await sendPartnerCurationEmail({ to: partnerEmail, decision, reviewNote });
    }
  }

  revalidatePath("/admin");
}

export async function updateProduct(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const price_cents = parsePriceToCents(formData.get("price"));
  const status = formData.get("status") as Database["public"]["Enums"]["product_status"];

  if (!id || !name?.trim() || price_cents === null) {
    redirect("/admin?error=" + encodeURIComponent("Preencha nome e preço válidos."));
  }

  await supabase.from("products").update({ name, description, price_cents, status }).eq("id", id);
  revalidatePath("/admin");
}
