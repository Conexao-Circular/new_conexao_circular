"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function selectPlan(formData: FormData) {
  const planId = String(formData.get("plan_id") ?? "");

  if (!planId) {
    redirect("/onboarding/plano?error=" + encodeURIComponent("Selecione um plano."));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("profile_id", user.id)
    .in("status", ["pending", "active"])
    .maybeSingle();

  if (existing) {
    redirect("/onboarding/plano");
  }

  const { error } = await supabase.from("subscriptions").insert({
    profile_id: user.id,
    plan_id: planId,
    status: "pending",
  });

  if (error) {
    redirect("/onboarding/plano?error=" + encodeURIComponent(error.message));
  }

  redirect("/inicio");
}
