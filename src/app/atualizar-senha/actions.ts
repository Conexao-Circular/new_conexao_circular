"use server";

import { redirect } from "next/navigation";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 6) {
    redirect(
      "/atualizar-senha?error=" + encodeURIComponent("A senha deve ter pelo menos 6 caracteres."),
    );
  }

  if (password !== confirmPassword) {
    redirect("/atualizar-senha?error=" + encodeURIComponent("As senhas não conferem."));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/login?error=" + encodeURIComponent("O link de redefinição expirou. Solicite um novo link."),
    );
  }

  const firstAccess = user.app_metadata?.must_change_password === true;
  if (firstAccess) {
    const acceptedTerms = formData.get("acceptedTerms") === "on";
    const acceptedPrivacy = formData.get("acceptedPrivacy") === "on";
    if (!acceptedTerms || !acceptedPrivacy) {
      redirect(
        "/atualizar-senha?primeiro-acesso=1&error=" +
          encodeURIComponent("Aceite os Termos de Uso e a Política de Privacidade para continuar."),
      );
    }
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(
      "/atualizar-senha?error=" +
        encodeURIComponent(
          "Não foi possível atualizar sua senha. Solicite um novo link e tente novamente.",
        ),
    );
  }

  if (firstAccess) {
    const { error: consentError } = await supabase.rpc("accept_legal_documents", {
      p_terms_version: TERMS_VERSION,
      p_privacy_version: PRIVACY_VERSION,
    });
    if (consentError) {
      redirect(
        "/atualizar-senha?primeiro-acesso=1&error=" +
          encodeURIComponent(
            "A senha foi atualizada, mas não foi possível registrar os aceites. Entre novamente e tente concluir.",
          ),
      );
    }

    redirect("/inicio");
  }

  redirect(
    "/login?message=" + encodeURIComponent("Senha atualizada! Faça login com a nova senha."),
  );
}
