"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatAddress, parseTimeWindow, parseVolumes } from "@/lib/address";
import { notifyProfile } from "@/lib/push";
import type { Database } from "@/lib/supabase/types";

type WasteType = Database["public"]["Enums"]["waste_type"];

const WASTE_TYPES: WasteType[] = ["organic", "solid", "both"];

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function createCollectionRequest(formData: FormData) {
  const wasteType = formData.get("waste_type");
  const zip = str(formData, "address_zip");
  const street = str(formData, "address_street");
  const number = str(formData, "address_number");
  const neighborhood = str(formData, "address_neighborhood");
  const city = str(formData, "address_city");
  const state = str(formData, "address_state");
  const complement = str(formData, "address_complement");
  const reference = str(formData, "address_reference");

  const timeWindow = parseTimeWindow(formData.get("preferred_time_window"));
  const volumes = parseVolumes(formData.get("estimated_volumes"));
  const estimatedWeight = formData.get("estimated_weight_kg");
  const preferredDate = formData.get("preferred_date");
  const cooperativeId = formData.get("cooperative_id");
  const notes = str(formData, "notes");
  const contactName = str(formData, "contact_name");
  const contactPhone = str(formData, "contact_phone");
  const accessInstructions = str(formData, "access_instructions");
  const dryMaterials = formData.getAll("dry_materials").filter((v): v is string => typeof v === "string");
  const photoPaths = formData
    .getAll("photo_paths")
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .slice(0, 3);

  if (
    typeof wasteType !== "string" ||
    !WASTE_TYPES.includes(wasteType as WasteType) ||
    !zip ||
    !street ||
    !number ||
    !neighborhood ||
    !city ||
    !state
  ) {
    redirect("/coletas/nova?error=" + encodeURIComponent("Preencha o tipo de resíduo e o endereço completo."));
  }
  if (volumes === null && formData.get("estimated_volumes")) {
    redirect("/coletas/nova?error=" + encodeURIComponent("Quantidade de volumes inválida."));
  }
  if (timeWindow === null) {
    redirect("/coletas/nova?error=" + encodeURIComponent("Selecione uma janela de horário válida."));
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let resolvedCooperativeId: string | null =
    typeof cooperativeId === "string" && cooperativeId ? cooperativeId : null;

  if (!resolvedCooperativeId) {
    const { data: matched } = await supabase.rpc("match_cooperative_for_request", {
      p_waste_type: wasteType as WasteType,
    });
    resolvedCooperativeId = matched ?? null;
  }

  const address = formatAddress({ zip, street, number, complement, neighborhood, city, state, reference });

  const { data: request, error } = await supabase
    .from("collection_requests")
    .insert({
      requester_id: user.id,
      waste_type: wasteType as WasteType,
      address,
      address_zip: zip,
      address_street: street,
      address_number: number,
      address_complement: complement,
      address_neighborhood: neighborhood,
      address_city: city,
      address_state: state,
      address_reference: reference,
      estimated_weight_kg:
        typeof estimatedWeight === "string" && estimatedWeight.trim() ? Number(estimatedWeight) : null,
      estimated_volumes: volumes,
      preferred_date: typeof preferredDate === "string" && preferredDate ? preferredDate : null,
      preferred_time_window: timeWindow,
      cooperative_id: resolvedCooperativeId,
      contact_name: contactName,
      contact_phone: contactPhone,
      access_instructions: accessInstructions,
      dry_materials: dryMaterials,
      notes,
    })
    .select("id")
    .single();

  if (error || !request) {
    redirect("/coletas/nova?error=" + encodeURIComponent("Não foi possível criar a solicitação. Tente novamente."));
  }

  if (resolvedCooperativeId) {
    const { data: cooperative } = await supabase
      .from("cooperatives")
      .select("profile_id")
      .eq("id", resolvedCooperativeId)
      .maybeSingle();

    if (cooperative?.profile_id) {
      await notifyProfile(cooperative.profile_id, {
        title: "Nova coleta solicitada ♻️",
        body: `${address} — ${wasteType === "organic" ? "Orgânico" : wasteType === "solid" ? "Seco" : "Orgânico + Seco"}`,
        url: `/coletas/${request.id}`,
      });
    }
  }

  if (photoPaths.length > 0) {
    const finalUrls: string[] = [];
    for (const pendingPath of photoPaths) {
      const filename = pendingPath.split("/").pop();
      if (!filename) continue;
      const finalPath = `${user.id}/${request.id}/${filename}`;
      const { error: moveError } = await supabase.storage.from("collection-proofs").move(pendingPath, finalPath);
      if (!moveError) finalUrls.push(finalPath);
    }
    if (finalUrls.length > 0) {
      await supabase.from("collection_request_photos").insert(
        finalUrls.map((url, index) => ({ request_id: request.id, url, sort_order: index })),
      );
    }
  }

  redirect(`/coletas/${request.id}`);
}
