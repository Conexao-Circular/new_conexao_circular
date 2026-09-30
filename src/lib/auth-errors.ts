type AuthErrorLike = {
  code?: string | null;
  message?: string | null;
  status?: number | null;
};

export type AuthReason =
  | "already-registered"
  | "email-not-confirmed"
  | "confirmation-link-invalid"
  | "rate-limited"
  | "account-blocked";

function normalizedError(error: AuthErrorLike) {
  return `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
}

export function isDuplicateSignupError(error: AuthErrorLike) {
  const value = normalizedError(error);
  return value.includes("already registered") || value.includes("user_already_exists") || value.includes("email_exists");
}

export function getLoginFailure(error: AuthErrorLike): { message: string; reason?: AuthReason } {
  const value = normalizedError(error);

  if (value.includes("email_not_confirmed") || value.includes("email not confirmed")) {
    return {
      message: "Seu e-mail ainda não foi confirmado. Confirme o endereço para liberar o login.",
      reason: "email-not-confirmed",
    };
  }

  if (value.includes("user_banned") || value.includes("banned")) {
    return {
      message: "Esta conta está temporariamente bloqueada. Entre em contato com a Conexão Circular para entender o motivo.",
      reason: "account-blocked",
    };
  }

  if (value.includes("rate_limit") || value.includes("too many") || error.status === 429) {
    return {
      message: "Foram feitas muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.",
      reason: "rate-limited",
    };
  }

  if (value.includes("invalid login credentials") || value.includes("invalid_credentials")) {
    return {
      message: "Não foi possível entrar: o e-mail e a senha não correspondem. Confira os dados ou recupere sua senha.",
    };
  }

  return { message: "Não foi possível entrar agora. Confira os dados e tente novamente." };
}

export function getSignupFailure(error: AuthErrorLike) {
  const value = normalizedError(error);

  if (isDuplicateSignupError(error)) {
    return {
      message: "Este e-mail já está cadastrado. Entre na sua conta para continuar.",
      reason: "already-registered" as const,
    };
  }

  if (value.includes("rate_limit") || value.includes("too many") || error.status === 429) {
    return {
      message: "O cadastro atingiu o limite de tentativas. Aguarde alguns minutos e tente novamente.",
      reason: "rate-limited" as const,
    };
  }

  if (value.includes("email address not authorized") || value.includes("smtp")) {
    return { message: "Não conseguimos enviar o e-mail de confirmação agora. Tente novamente em alguns minutos." };
  }

  return { message: "Não foi possível criar a conta agora. Confira os dados e tente novamente." };
}

export function getResendConfirmationFailure(error: AuthErrorLike) {
  const value = normalizedError(error);

  if (value.includes("rate_limit") || value.includes("too many") || error.status === 429) {
    return "Você já pediu um link recentemente. Aguarde cerca de 60 segundos antes de tentar de novo.";
  }

  if (value.includes("email address not authorized") || value.includes("smtp")) {
    return "O serviço de e-mail está temporariamente indisponível. Tente novamente mais tarde.";
  }

  return "Não foi possível reenviar o link agora. Confira o endereço e tente novamente.";
}

export function getPasswordResetFailure(error: AuthErrorLike) {
  const value = normalizedError(error);

  if (value.includes("rate_limit") || value.includes("too many") || error.status === 429) {
    return "Você já solicitou uma redefinição recentemente. Aguarde cerca de 60 segundos antes de tentar de novo.";
  }

  if (value.includes("email address not authorized") || value.includes("smtp")) {
    return "Não conseguimos enviar o link de redefinição agora. Tente novamente mais tarde.";
  }

  return "Não foi possível solicitar a redefinição agora. Confira o endereço e tente novamente.";
}
