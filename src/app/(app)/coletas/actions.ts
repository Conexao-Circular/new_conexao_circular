"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function cancelCollectionRequest(formData: FormData) {
  const id = formData.get("id");

  if (typeof id !== "string" || !id) {
    return;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("collection_requests")
    .update({ status: "canceled" })
    .eq("id", id)
    .eq("requester_id", user.id)
    .eq("status", "requested");

  revalidatePath("/coletas");
  revalidatePath("/inicio");
}
