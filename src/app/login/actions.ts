"use server";

import { redirect } from "next/navigation";
import { getLoginFailure } from "@/lib/auth-errors";
import { authRedirect, getSafeNextPath, isValidEmail, normalizeEmail } from "@/lib/auth-routes";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const next = getSafeNextPath(String(formData.get("next") ?? ""));

  if (!email || !isValidEmail(email) || !password) {
    redirect(
      authRedirect("/login", { error: "Informe um e-mail válido e sua senha.", email, next }),
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const failure = getLoginFailure(error);
    redirect(
      authRedirect("/login", { error: failure.message, reason: failure.reason, email, next }),
    );
  }

  if (data.user?.app_metadata?.must_change_password === true) {
    redirect("/atualizar-senha?primeiro-acesso=1");
  }

  redirect(next);
}
