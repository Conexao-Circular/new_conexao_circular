"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const REDEEM_ERRORS: Record<string, string> = {
  insufficient_points: "Pontos insuficientes para este resgate.",
  item_unavailable: "Benefício indisponível.",
  not_redeemable: "Este benefício não é resgatável com pontos.",
};

export async function redeemItem(formData: FormData) {
  const itemId = formData.get("item_id");
  if (typeof itemId !== "string" || !itemId) redirect("/pontos");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: code, error } = await supabase.rpc("redeem_partner_item", { p_item_id: itemId });

  if (error || !code) {
    const message = REDEEM_ERRORS[error?.message ?? ""] ?? "Não foi possível resgatar. Tente novamente.";
    redirect("/pontos?error=" + encodeURIComponent(message));
  }

  revalidatePath("/pontos");
  redirect("/pontos?resgatado=" + encodeURIComponent(code));
}
