import Link from "next/link";
import { AuthShell, FormError } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "./actions";

export default async function AtualizarSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; "primeiro-acesso"?: string }>;
}) {
  const { error, "primeiro-acesso": firstAccess } = await searchParams;
  const isFirstAccess = firstAccess === "1";

  return (
    <AuthShell
      title={isFirstAccess ? "Proteja sua conta" : "Definir nova senha"}
      subtitle={
        isFirstAccess
          ? "Troque a senha inicial e confirme os documentos para concluir seu primeiro acesso."
          : "Escolha uma nova senha para sua conta."
      }
    >
      <FormError message={error} />

      <form action={updatePassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="Repita a senha"
          />
        </div>

        {isFirstAccess ? (
          <div className="space-y-3 rounded-xl border border-cc-sand/50 bg-cc-cream/60 p-4 text-sm text-cc-green">
            <label className="flex items-start gap-2">
              <input
                name="acceptedTerms"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 accent-cc-orange"
              />
              <span>
                Li e aceito os{" "}
                <Link
                  href="/termos"
                  target="_blank"
                  className="font-medium text-cc-orange hover:underline"
                >
                  Termos de Uso
                </Link>
                .
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                name="acceptedPrivacy"
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 accent-cc-orange"
              />
              <span>
                Li e estou ciente da{" "}
                <Link
                  href="/privacidade"
                  target="_blank"
                  className="font-medium text-cc-orange hover:underline"
                >
                  Política de Privacidade
                </Link>
                .
              </span>
            </label>
          </div>
        ) : null}

        <Button type="submit" className="w-full">
          Salvar nova senha
        </Button>
      </form>
    </AuthShell>
  );
}
