"use server";

import { redirect } from "next/navigation";
import { getPasswordResetFailure } from "@/lib/auth-errors";
import { authRedirect, isValidEmail, normalizeEmail } from "@/lib/auth-routes";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  if (!isValidEmail(email)) {
    redirect(authRedirect("/recuperar-senha", { error: "Informe um e-mail válido.", email }));
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/atualizar-senha`,
  });

  if (error) {
    redirect(authRedirect("/recuperar-senha", { error: getPasswordResetFailure(error), email }));
  }

  redirect(authRedirect("/recuperar-senha", {
    message: "Se houver uma conta com esse e-mail, enviaremos um link de redefinição.",
    email,
  }));
}
