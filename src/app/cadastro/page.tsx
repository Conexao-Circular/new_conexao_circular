import Link from "next/link";
import { AuthShell, FormError } from "@/components/auth-shell";
import { SignupForm } from "@/components/signup-form";
import { getSafeNextPath } from "@/lib/auth-routes";

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ref?: string; role?: string; next?: string }>;
}) {
  const { error, ref, role, next: requestedNext } = await searchParams;
  const next = getSafeNextPath(requestedNext);
  const loginHref = next === "/inicio" ? "/login" : { pathname: "/login", query: { next } };

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Cadastre-se para fazer parte da rede Conexão Circular."
      footer={
        <>
          Já tem conta?{" "}
          <Link href={loginHref} className="font-medium text-cc-orange hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <FormError message={error} />
      <SignupForm ref={ref} initialRole={role} next={next} />
    </AuthShell>
  );
}
