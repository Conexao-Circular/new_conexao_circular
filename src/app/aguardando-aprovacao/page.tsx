import { redirect } from "next/navigation";
import { Clock3, XCircle } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(app)/inicio/actions";

export default async function AguardandoAprovacaoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("approval_status, access_override")
    .eq("id", user.id)
    .single();

  if (!profile || profile.access_override || profile.approval_status === "approved") {
    redirect("/inicio");
  }

  const rejected = profile.approval_status === "rejected";

  return (
    <AuthShell
      title={rejected ? "Cadastro não aprovado" : "Cadastro em análise"}
      subtitle={
        rejected
          ? "Sua solicitação de acesso não foi aprovada."
          : "Falta pouco: um administrador precisa liberar seu acesso."
      }
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full ${rejected ? "bg-destructive/10" : "bg-cc-cream/60"}`}
        >
          {rejected ? (
            <XCircle className="h-7 w-7 text-destructive" />
          ) : (
            <Clock3 className="h-7 w-7 text-cc-green" />
          )}
        </div>

        <p className="text-sm text-foreground">
          {rejected
            ? "Entre em contato com a Conexão Circular para entender os próximos passos."
            : "Assim que sua conta for aprovada, você recebe acesso completo à plataforma por 7 dias grátis, sem precisar assinar nenhum plano."}
        </p>

        <form action={logout} className="w-full">
          <Button type="submit" variant="outline" className="w-full">
            Sair
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
