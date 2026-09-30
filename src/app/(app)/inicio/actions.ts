"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notifyProfile } from "@/lib/push";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (!profile || profile.role !== "admin") {
    redirect("/inicio");
  }

  return supabase;
}

export async function approveProduct(formData: FormData) {
  const supabase = await requireAdmin();
  const productId = formData.get("product_id") as string;

  const { data: product } = await supabase
    .from("products")
    .update({ approved: true })
    .eq("id", productId)
    .select("partner_id, name")
    .single();

  if (product) {
    await notifyProfile(product.partner_id, {
      title: "Produto aprovado! 🎉",
      body: `"${product.name}" já está publicado no Marketplace.`,
      url: "/loja/produtos",
    });
  }

  revalidatePath("/inicio");
  revalidatePath("/perfil");
}

export async function rejectProduct(formData: FormData) {
  const supabase = await requireAdmin();
  const productId = formData.get("product_id") as string;

  const { data: product } = await supabase
    .from("products")
    .update({ status: "inactive" })
    .eq("id", productId)
    .select("partner_id, name")
    .single();

  if (product) {
    await notifyProfile(product.partner_id, {
      title: "Produto recusado",
      body: `"${product.name}" não foi aprovado. Edite o anúncio e reenvie para análise.`,
      url: "/loja/produtos",
    });
  }

  revalidatePath("/inicio");
  revalidatePath("/perfil");
}
