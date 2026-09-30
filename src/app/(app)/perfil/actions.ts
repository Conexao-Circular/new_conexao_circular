"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

async function uploadStoreBanner(supabase: SupabaseClient<Database>, userId: string, photo: File) {
  const extension = photo.name.split(".").pop() ?? "jpg";
  const path = `${userId}/store/banner.${extension}`;

  const { error } = await supabase.storage.from("marketplace").upload(path, photo, {
    upsert: true,
    contentType: photo.type || undefined,
  });

  if (error) return null;

  const { data } = supabase.storage.from("marketplace").getPublicUrl(path);
  return data.publicUrl;
}

export async function updateStoreProfile(formData: FormData) {
  const storeName = formData.get("store_name");
  const storeDescription = formData.get("store_description");
  const originZipRaw = formData.get("origin_zip");
  const photo = formData.get("photo");

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

  const originZip =
    typeof originZipRaw === "string" ? originZipRaw.replace(/\D/g, "").slice(0, 8) : "";

  const update: Database["public"]["Tables"]["profiles"]["Update"] = {
    store_name: typeof storeName === "string" && storeName.trim() ? storeName.trim() : null,
    store_description:
      typeof storeDescription === "string" && storeDescription.trim() ? storeDescription.trim() : null,
    origin_zip: originZip.length === 8 ? originZip : null,
  };

  if (photo instanceof File && photo.size > 0) {
    const url = await uploadStoreBanner(supabase, user.id, photo);
    if (url) {
      update.store_image_url = url;
    }
  }

  await supabase.from("profiles").update(update).eq("id", user.id);

  redirect("/perfil");
}
