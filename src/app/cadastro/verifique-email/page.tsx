import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthShell, FormError, FormNotice } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { getSafeNextPath } from "@/lib/auth-routes";
import { resendConfirmation } from "./actions";

export default async function VerifiqueEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string; error?: string; message?: string }>;
}) {
  const { email, next: requestedNext, error, message } = await searchParams;
  const next = getSafeNextPath(requestedNext, "/onboarding/plano");

  return (
    <AuthShell title="Confirme seu e-mail" subtitle="Falta só um passo para começar.">
      <FormError message={error} />
      <FormNotice message={message} />
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cc-cream/60">
          <Mail className="h-7 w-7 text-cc-green" />
        </div>

        <p className="text-sm text-foreground">
          Enviamos um link de confirmação
          {email ? (
            <>
              {" "}
              para <strong>{email}</strong>
            </>
          ) : null}
          . Abra seu e-mail e clique no link para ativar sua conta.
        </p>

        <p className="text-xs text-muted-foreground">Não encontrou? Verifique o spam/lixo eletrônico antes de pedir um novo link.</p>

        {email ? (
          <form action={resendConfirmation} className="w-full space-y-2">
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="next" value={next} />
            <SubmitButton type="submit" variant="outline" className="w-full">
              Reenviar confirmação
            </SubmitButton>
          </form>
        ) : null}

        <Button asChild className="w-full">
          <Link href="/login">Ir para o login</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
