import Link from "next/link";
import { AuthShell, FormError, FormNotice } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "./actions";

export default async function RecuperarSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; email?: string }>;
}) {
  const { error, message, email } = await searchParams;

  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Informe seu e-mail para receber um link de redefinição de senha."
      footer={
        <Link href="/login" className="font-medium text-cc-orange hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <FormError message={error} />
      <FormNotice message={message} />

      <form action={requestPasswordReset} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={email} placeholder="voce@exemplo.com" />
        </div>

        <Button type="submit" className="w-full">
          Enviar link de redefinição
        </Button>
      </form>
    </AuthShell>
  );
}
