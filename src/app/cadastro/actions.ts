"use server";

import { redirect } from "next/navigation";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { AGENT_ROLE, isAgentCircularEnabled } from "@/lib/agent-circular";
import { getSignupFailure } from "@/lib/auth-errors";
import { authRedirect, getSafeNextPath, isValidEmail, normalizeEmail } from "@/lib/auth-routes";

type SignupRole = Database["public"]["Enums"]["user_role"];

const VALID_ROLES: SignupRole[] = ["consumidor", "produtor", "cooperativa", AGENT_ROLE];

export async function signup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "") as SignupRole;
  const next = getSafeNextPath(String(formData.get("next") ?? ""));
  const ref = String(formData.get("ref") ?? "").trim();
  const termsAccepted = formData.get("terms_accepted") === "on";
  const marketingOptIn = formData.get("marketing_opt_in") === "on";
  const termsVersion = String(formData.get("terms_version") ?? "").trim();
  const privacyVersion = String(formData.get("privacy_version") ?? "").trim();
  const birthDate = String(formData.get("birth_date") ?? "").trim();
  const postalCode = String(formData.get("postal_code") ?? "").trim();
  const agentNeighborhood = String(formData.get("agent_neighborhood") ?? "").trim();
  const agentCity = String(formData.get("agent_city") ?? "").trim();
  const agentAvailability = String(formData.get("agent_availability") ?? "").trim();
  const agentInterests = formData
    .getAll("agent_interests")
    .map((value) => String(value).trim())
    .filter(Boolean)
    .slice(0, 8);
  const agentRulesAccepted = formData.get("agent_rules_accepted") === "on";

  if (!name || !email || !isValidEmail(email) || !password || !phone) {
    redirect(authRedirect("/cadastro", { error: "Preencha nome, e-mail válido, telefone e senha." }));
  }

  if (!VALID_ROLES.includes(role)) {
    redirect("/cadastro?error=" + encodeURIComponent("Selecione um perfil."));
  }

  if (role === "consumidor" && !birthDate) {
    redirect("/cadastro?error=" + encodeURIComponent("Informe sua data de nascimento."));
  }

  if (role === AGENT_ROLE && !isAgentCircularEnabled()) {
    redirect("/cadastro?error=" + encodeURIComponent("A inscrição de Agentes Circulares está temporariamente fechada."));
  }

  if (role === AGENT_ROLE && (!agentNeighborhood || !agentCity || !agentAvailability || agentInterests.length === 0)) {
    redirect("/cadastro?error=" + encodeURIComponent("Preencha território, disponibilidade e pelo menos uma área de interesse."));
  }

  if (role === AGENT_ROLE && !agentRulesAccepted) {
    redirect("/cadastro?error=" + encodeURIComponent("Aceite as regras do Programa de Agentes Circulares para continuar."));
  }

  if (password.length < 6) {
    redirect("/cadastro?error=" + encodeURIComponent("A senha deve ter pelo menos 6 caracteres."));
  }

  if (!termsAccepted) {
    redirect(
      "/cadastro?error=" +
        encodeURIComponent("Você precisa aceitar os Termos de Uso e a Política de Privacidade."),
    );
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const isProducerCircular = role === "produtor" || role === "cooperativa";
  const postSignupPath = role === AGENT_ROLE
    ? "/agente/formacao"
    : isProducerCircular
      ? "/onboarding/parceiro"
      : "/onboarding/plano";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        phone,
        role,
        birth_date: role === "consumidor" && birthDate ? birthDate : null,
        postal_code: role === "consumidor" && postalCode ? postalCode : null,
        marketing_opt_in: marketingOptIn,
        terms_version: termsVersion,
        privacy_version: privacyVersion,
        ...(role === AGENT_ROLE
          ? {
              agent_neighborhood: agentNeighborhood,
              agent_city: agentCity,
              agent_is_available: agentAvailability === "sim",
              agent_interests: agentInterests,
              agent_terms_accepted: true,
              agent_privacy_accepted: true,
              agent_terms_version: termsVersion,
              agent_privacy_version: privacyVersion,
              agent_rules_accepted: true,
              agent_rules_version: "2026.1",
            }
          : {}),
        ...(ref ? { ref } : {}),
      },
      emailRedirectTo: `${siteUrl}/auth/confirm?next=${encodeURIComponent(postSignupPath)}`,
    },
  });

  if (error) {
    const failure = getSignupFailure(error);
    if (failure.reason === "already-registered") {
      redirect(authRedirect("/login", { email, reason: failure.reason, next }));
    }
    redirect(authRedirect("/cadastro", { error: failure.message, reason: failure.reason }));
  }

  // Supabase intentionally obfuscates an existing account in some projects
  // instead of returning a duplicate-user error. An empty identities list is
  // the signal that no new account was created.
  if (data.user?.identities && data.user.identities.length === 0) {
    redirect(
      authRedirect("/login", {
        email,
        reason: "already-registered",
        next,
      }),
    );
  }

  if (data.session) {
    redirect(postSignupPath);
  }

  redirect(authRedirect("/cadastro/verifique-email", { email, next: postSignupPath }));
}
