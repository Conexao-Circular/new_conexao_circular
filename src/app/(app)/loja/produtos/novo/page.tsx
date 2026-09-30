import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FormError } from "@/components/auth-shell";
import { ProductWizard } from "@/components/product-wizard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function NovoAnuncioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (!profile || profile.role !== "produtor") {
    redirect("/inicio");
  }

  return (
    <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <Link href="/loja/produtos" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para meus anúncios
        </Link>
      </div>

      <header>
        <h1 className="font-heading text-2xl font-semibold text-cc-green">Novo anúncio</h1>
        <p className="text-sm text-muted-foreground">
          Conte como é o seu produto. Após o envio, ele passa por uma análise antes de aparecer para os consumidores
          no Marketplace.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Dados do produto</CardTitle>
        </CardHeader>
        <CardContent>
          <FormError message={error} />
          <ProductWizard userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
