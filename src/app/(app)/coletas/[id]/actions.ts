"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { notifyProfile } from "@/lib/push";

export async function cancelCollection(formData: FormData) {
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

  revalidatePath(`/coletas/${id}`);
  revalidatePath("/coletas");
  revalidatePath("/inicio");
}

export async function confirmCollection(formData: FormData) {
  const id = formData.get("id");
  const confirmedWeight = formData.get("confirmed_weight_kg");
  const photo = formData.get("photo");
  const executionNotesRaw = formData.get("execution_notes");
  const executionNotes =
    typeof executionNotesRaw === "string" && executionNotesRaw.trim() ? executionNotesRaw.trim() : null;

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

  const { data: cooperative } = await supabase
    .from("cooperatives")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!cooperative) {
    redirect(`/coletas/${id}?error=Apenas a cooperativa responsável pode confirmar esta coleta.`);
  }

  const { data: request } = await supabase
    .from("collection_requests")
    .select("id, cooperative_id, status, requester_id")
    .eq("id", id)
    .maybeSingle();

  if (!request || request.cooperative_id !== cooperative.id || request.status !== "requested") {
    redirect(`/coletas/${id}?error=Esta coleta não pode ser confirmada.`);
  }

  const weight =
    typeof confirmedWeight === "string" && confirmedWeight.trim() ? Number(confirmedWeight) : null;

  if (weight === null || Number.isNaN(weight) || weight <= 0) {
    redirect(`/coletas/${id}?error=Informe o peso confirmado da coleta.`);
  }

  let proofPath: string | null = null;

  if (photo instanceof File && photo.size > 0) {
    const extension = photo.name.split(".").pop() ?? "jpg";
    const path = `${request.requester_id}/${request.id}/comprovante.${extension}`;

    const { error: uploadError } = await supabase.storage.from("collection-proofs").upload(path, photo, {
      upsert: true,
      contentType: photo.type || undefined,
    });

    if (!uploadError) {
      proofPath = path;
    }
  }

  await supabase
    .from("collection_requests")
    .update({
      status: "confirmed",
      confirmed_weight_kg: weight,
      execution_notes: executionNotes,
      ...(proofPath ? { proof_image_url: proofPath } : {}),
    })
    .eq("id", id);

  await notifyProfile(request.requester_id, {
    title: "Coleta confirmada ♻️",
    body: `Sua coleta de ${weight} kg foi confirmada e seus pontos foram creditados.`,
    url: `/coletas/${id}`,
  });

  revalidatePath(`/coletas/${id}`);
  revalidatePath("/coletas");
  revalidatePath("/inicio");
}
