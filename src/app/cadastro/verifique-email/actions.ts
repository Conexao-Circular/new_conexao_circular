"use server";

import { redirect } from "next/navigation";
import { getResendConfirmationFailure } from "@/lib/auth-errors";
import { authRedirect, getSafeNextPath, isValidEmail, normalizeEmail } from "@/lib/auth-routes";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export async function resendConfirmation(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const next = getSafeNextPath(String(formData.get("next") ?? ""), "/onboarding/plano");

  if (!isValidEmail(email)) {
    redirect(
      authRedirect("/cadastro/verifique-email", {
        error: "Informe um e-mail válido para reenviar a confirmação.",
        email,
        next,
      }),
    );
  }

  const siteUrl = await getSiteUrl();
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirect(
      authRedirect("/cadastro/verifique-email", {
        error: getResendConfirmationFailure(error),
        email,
        next,
      }),
    );
  }

  redirect(
    authRedirect("/cadastro/verifique-email", {
      message: "Enviamos um novo link de confirmação. Aguarde alguns instantes e verifique também o spam.",
      email,
      next,
    }),
  );
}
