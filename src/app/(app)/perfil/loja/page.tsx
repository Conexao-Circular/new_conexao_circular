import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { PRODUCER_APPLICATION_STATUS_LABELS } from "@/lib/labels";
import { updateStoreProfile } from "../actions";

export default async function EditarLojaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name, store_name, store_description, store_image_url, origin_zip")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "produtor") {
    redirect("/inicio");
  }

  const { data: application } = await supabase
    .from("producer_applications")
    .select("status")
    .eq("profile_id", user.id)
    .maybeSingle();

  return (
    <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <Link href="/perfil" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para o perfil
        </Link>
      </div>

      <header>
        <h1 className="font-heading text-2xl font-semibold text-cc-green">Editar loja</h1>
        <p className="text-sm text-muted-foreground">
          Personalize como sua loja aparece para os consumidores no Marketplace.
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">Perfil de parceiro (curadoria)</CardTitle>
          {application ? (
            <Badge
              variant={
                application.status === "approved"
                  ? "default"
                  : application.status === "rejected"
                    ? "destructive"
                    : "secondary"
              }
            >
              {PRODUCER_APPLICATION_STATUS_LABELS[application.status] ?? application.status}
            </Badge>
          ) : (
            <Badge variant="outline">Não enviado</Badge>
          )}
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link href="/onboarding/parceiro">
              {application ? "Ver/editar candidatura" : "Cadastrar como parceiro"}
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-t-xl bg-cc-cream/50">
          {profile.store_image_url ? (
            <Image
              src={profile.store_image_url}
              alt={profile.store_name ?? profile.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          ) : (
            <Store className="h-10 w-10 text-cc-sand" />
          )}
        </div>
        <CardHeader>
          <CardTitle>Dados da loja</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateStoreProfile} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="store_name">Nome da loja</Label>
              <Input id="store_name" name="store_name" defaultValue={profile.store_name ?? ""} placeholder={profile.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store_description">Descrição da loja</Label>
              <Textarea
                id="store_description"
                name="store_description"
                rows={4}
                defaultValue={profile.store_description ?? ""}
                placeholder="Conte sobre o seu negócio, seus produtos e o que torna a sua loja especial."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="origin_zip">CEP de origem (envio)</Label>
              <Input
                id="origin_zip"
                name="origin_zip"
                inputMode="numeric"
                maxLength={9}
                defaultValue={profile.origin_zip ?? ""}
                placeholder="00000-000"
              />
              <p className="text-xs text-muted-foreground">
                De onde seus produtos são enviados — usado para calcular o frete até o comprador.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Banner da loja</Label>
              <Input id="photo" name="photo" type="file" accept="image/*" />
            </div>

            <Button type="submit" className="w-full">
              Salvar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
