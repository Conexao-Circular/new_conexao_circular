import Link from "next/link";
import { AuthShell, FormError, FormNotice } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSafeNextPath } from "@/lib/auth-routes";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; reason?: string; email?: string; next?: string }>;
}) {
  const { error, message, reason, email, next: requestedNext } = await searchParams;
  const next = getSafeNextPath(requestedNext);
  const verificationHref = {
    pathname: "/cadastro/verifique-email",
    query: { email: email ?? "", next },
  };
  const signupHref = next === "/inicio" ? "/cadastro" : { pathname: "/cadastro", query: { next } };

  return (
    <AuthShell
      title="Entrar"
      subtitle="Acesse sua conta para acompanhar pontos, coletas e benefícios."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href={signupHref} className="font-medium text-cc-orange hover:underline">
            Cadastre-se
          </Link>
        </>
      }
    >
      <FormError message={error} />
      <FormNotice message={message} />

      {reason === "already-registered" ? (
        <div className="mb-4 rounded-xl border border-cc-sand/50 bg-cc-cream/60 px-3 py-3 text-sm text-cc-green">
          <p>Este e-mail já possui uma conta. Entre com sua senha ou recupere o acesso.</p>
          <Link href={{ pathname: "/recuperar-senha", query: { email: email ?? "" } }} className="mt-1 inline-block font-medium text-cc-orange hover:underline">
            Recuperar minha senha
          </Link>
        </div>
      ) : null}

      {reason === "email-not-confirmed" ? (
        <div className="mb-4 rounded-xl border border-cc-sand/50 bg-cc-cream/60 px-3 py-3 text-sm text-cc-green">
          <p>O login está bloqueado porque o e-mail da conta ainda não foi confirmado.</p>
          <Link href={verificationHref} className="mt-1 inline-block font-medium text-cc-orange hover:underline">
            Reenviar confirmação por e-mail
          </Link>
        </div>
      ) : null}

      {reason === "confirmation-link-invalid" ? (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive">
          <p>O link de confirmação é inválido ou expirou. Volte ao cadastro para solicitar um novo link.</p>
          <Link href="/cadastro" className="mt-1 inline-block font-medium text-cc-orange hover:underline">
            Voltar ao cadastro
          </Link>
        </div>
      ) : null}

      <form action={login} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={email} placeholder="voce@exemplo.com" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
        </div>

        <div className="flex justify-end">
          <Link href="/recuperar-senha" className="text-sm text-cc-orange hover:underline">
            Esqueceu sua senha?
          </Link>
        </div>

        <Button type="submit" className="w-full">
          Entrar
        </Button>
      </form>
    </AuthShell>
  );
}
