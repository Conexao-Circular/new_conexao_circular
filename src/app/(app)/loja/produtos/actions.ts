"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parsePriceToCents, parsePoints } from "@/lib/pricing";
import { MAX_POINTS_PER_BRL, maxPointsForPrice } from "@/lib/points";
import {
  parseStock,
  parseUnit,
  parseTags,
  parseMaterialOrigin,
  resolveCategory,
  parseWeightGrams,
  parseDimension,
} from "@/lib/catalog";
import { PRODUCT_CATEGORY_SUGGESTIONS } from "./category-suggestions";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const MAX_PHOTOS = 5;

/**
 * Photos are uploaded to Storage directly from the browser (see
 * ProductPhotoManager) and their public URLs arrive as `photo_urls`. We only
 * accept URLs that point to this user's own folder in the marketplace bucket,
 * so a client can't inject arbitrary URLs.
 */
function getPhotoUrls(formData: FormData, userId: string): string[] {
  const prefixMarker = `/marketplace/${userId}/`;
  return formData
    .getAll("photo_urls")
    .filter((v): v is string => typeof v === "string" && v.includes(prefixMarker))
    .slice(0, MAX_PHOTOS);
}

function storagePathFromUrl(url: string, userId: string): string | null {
  const marker = `/marketplace/${userId}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return `${userId}/${url.slice(index + marker.length)}`;
}

/** Records already-uploaded photo URLs in product_images. Returns the cover. */
async function recordProductImages(
  supabase: SupabaseClient<Database>,
  productId: string,
  urls: string[],
  startOrder = 0,
): Promise<string | null> {
  if (urls.length === 0) return null;
  await supabase.from("product_images").insert(
    urls.map((url, index) => ({ product_id: productId, url, sort_order: startOrder + index })),
  );
  return urls[0];
}

type ParsedProductForm =
  | { ok: true; data: {
      name: string;
      description: string | null;
      category: string;
      priceCents: number;
      pointsValue: number;
      stock: number;
      unit: string;
      materialOrigin: string[];
      productionTechnique: string | null;
      sustainabilityNote: string | null;
      tags: string[];
      weightGrams: number | null;
      lengthCm: number | null;
      widthCm: number | null;
      heightCm: number | null;
    } }
  | { ok: false; error: string };

/** Shared validation for create/update — every required field fails safe (null) instead of silently defaulting. */
function parseProductForm(formData: FormData): ParsedProductForm {
  const name = formData.get("name");
  const description = formData.get("description");
  const priceCents = parsePriceToCents(formData.get("price"));
  const category = resolveCategory(formData, PRODUCT_CATEGORY_SUGGESTIONS);
  const stock = parseStock(formData.get("stock"));
  const unit = parseUnit(formData.get("unit"));
  const productionTechnique = formData.get("production_technique");
  const sustainabilityNote = formData.get("sustainability_note");

  if (typeof name !== "string" || !name.trim()) {
    return { ok: false, error: "Preencha o nome do produto." };
  }
  if (priceCents === null) {
    return { ok: false, error: "Informe um preço válido." };
  }
  if (!category) {
    return { ok: false, error: "Selecione uma categoria." };
  }
  if (stock === null) {
    return { ok: false, error: "Informe a quantidade em estoque (0 ou mais)." };
  }
  if (unit === null) {
    return { ok: false, error: "Selecione uma unidade de medida válida." };
  }

  // Mesmo teto do check constraint products_points_value_within_cap. Validado
  // aqui para o produtor ver uma mensagem, e no banco para valer de verdade.
  const pointsValue = parsePoints(formData.get("points_value"));
  const maxPoints = maxPointsForPrice(priceCents);
  if (pointsValue > maxPoints) {
    return {
      ok: false,
      error: `Máximo de ${maxPoints} ${maxPoints === 1 ? "ponto" : "pontos"} para um produto desse preço (limite de ${MAX_POINTS_PER_BRL} ponto por real).`,
    };
  }

  const weightGrams = parseWeightGrams(formData.get("weight_grams"));
  const lengthCm = parseDimension(formData.get("length_cm"));
  const widthCm = parseDimension(formData.get("width_cm"));
  const heightCm = parseDimension(formData.get("height_cm"));
  if (weightGrams === undefined || lengthCm === undefined || widthCm === undefined || heightCm === undefined) {
    return { ok: false, error: "Peso e dimensões devem ser números positivos." };
  }

  return {
    ok: true,
    data: {
      name: name.trim(),
      description: typeof description === "string" && description.trim() ? description.trim() : null,
      category,
      priceCents,
      pointsValue,
      stock,
      unit,
      materialOrigin: parseMaterialOrigin(formData),
      productionTechnique:
        typeof productionTechnique === "string" && productionTechnique.trim()
          ? productionTechnique.trim()
          : null,
      sustainabilityNote:
        typeof sustainabilityNote === "string" && sustainabilityNote.trim()
          ? sustainabilityNote.trim()
          : null,
      tags: parseTags(formData.get("tags")),
      weightGrams,
      lengthCm,
      widthCm,
      heightCm,
    },
  };
}

export async function createProduct(formData: FormData) {
  const parsed = parseProductForm(formData);
  if (!parsed.ok) {
    redirect("/loja/produtos/novo?error=" + encodeURIComponent(parsed.error));
  }

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

  const photoUrls = getPhotoUrls(formData, user.id);
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      partner_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      price_cents: parsed.data.priceCents,
      points_value: parsed.data.pointsValue,
      stock: parsed.data.stock,
      unit: parsed.data.unit,
      material_origin: parsed.data.materialOrigin,
      production_technique: parsed.data.productionTechnique,
      sustainability_note: parsed.data.sustainabilityNote,
      tags: parsed.data.tags,
      weight_grams: parsed.data.weightGrams,
      length_cm: parsed.data.lengthCm,
      width_cm: parsed.data.widthCm,
      height_cm: parsed.data.heightCm,
      status: "active",
      approved: false,
    })
    .select("id")
    .single();

  if (error || !product) {
    redirect("/loja/produtos/novo?error=" + encodeURIComponent("Não foi possível criar o anúncio. Tente novamente."));
  }

  if (photoUrls.length > 0) {
    const cover = await recordProductImages(supabase, product.id, photoUrls);
    if (cover) {
      await supabase.from("products").update({ image_url: cover }).eq("id", product.id);
    }
  }

  redirect("/loja/produtos?enviado=1");
}

export async function updateProduct(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    redirect("/loja/produtos");
  }

  const parsed = parseProductForm(formData);
  if (!parsed.ok) {
    redirect(`/loja/produtos/${id}/editar?error=` + encodeURIComponent(parsed.error));
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, partner_id, image_url, status, approved")
    .eq("id", id)
    .maybeSingle();

  if (!product || product.partner_id !== user.id) {
    redirect("/loja/produtos");
  }

  const photoUrls = getPhotoUrls(formData, user.id);

  // Re-submitting a rejected listing puts it back in the review queue automatically.
  const wasRejected = !product.approved && product.status === "inactive";

  await supabase
    .from("products")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      price_cents: parsed.data.priceCents,
      points_value: parsed.data.pointsValue,
      stock: parsed.data.stock,
      unit: parsed.data.unit,
      material_origin: parsed.data.materialOrigin,
      production_technique: parsed.data.productionTechnique,
      sustainability_note: parsed.data.sustainabilityNote,
      tags: parsed.data.tags,
      weight_grams: parsed.data.weightGrams,
      length_cm: parsed.data.lengthCm,
      width_cm: parsed.data.widthCm,
      height_cm: parsed.data.heightCm,
      ...(wasRejected ? { status: "active" as const } : {}),
    })
    .eq("id", id);

  if (photoUrls.length > 0) {
    const { count } = await supabase
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("product_id", id);

    const cover = await recordProductImages(supabase, id, photoUrls, count ?? 0);
    // Set as cover only if the product has no cover yet.
    if (cover && !product.image_url) {
      await supabase.from("products").update({ image_url: cover }).eq("id", id);
    }
  }

  redirect("/loja/produtos");
}

export async function deleteProduct(formData: FormData) {
  const id = formData.get("id");

  if (typeof id !== "string" || !id) {
    redirect("/loja/produtos");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: product } = await supabase.from("products").select("id, partner_id").eq("id", id).maybeSingle();

  if (!product || product.partner_id !== user.id) {
    redirect("/loja/produtos");
  }

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    // FK violation (23503): product already has orders linked, can't hard-delete.
    if (error.code === "23503") {
      redirect(
        "/loja/produtos?error=" +
          encodeURIComponent("Este anúncio já teve pedidos e não pode ser excluído. Use \"Pausar\" para escondê-lo."),
      );
    }
    redirect("/loja/produtos?error=" + encodeURIComponent("Não foi possível excluir o anúncio. Tente novamente."));
  }

  redirect("/loja/produtos?excluido=1");
}

export async function toggleProductStatus(formData: FormData) {
  const id = formData.get("id");

  if (typeof id !== "string" || !id) {
    redirect("/loja/produtos");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: product } = await supabase.from("products").select("id, partner_id, status").eq("id", id).maybeSingle();

  if (!product || product.partner_id !== user.id) {
    redirect("/loja/produtos");
  }

  await supabase
    .from("products")
    .update({ status: product.status === "active" ? "inactive" : "active" })
    .eq("id", id);

  redirect("/loja/produtos");
}

/** Removes a saved gallery photo: deletes the row, best-effort removes the Storage object, and re-picks a cover if needed. */
export async function deleteProductImage(formData: FormData) {
  const imageId = formData.get("image_id");
  const productId = formData.get("product_id");

  if (typeof imageId !== "string" || !imageId || typeof productId !== "string" || !productId) {
    redirect("/loja/produtos");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, partner_id, image_url")
    .eq("id", productId)
    .maybeSingle();

  if (!product || product.partner_id !== user.id) {
    redirect("/loja/produtos");
  }

  const { data: image } = await supabase
    .from("product_images")
    .select("id, url")
    .eq("id", imageId)
    .eq("product_id", productId)
    .maybeSingle();

  if (!image) {
    redirect(`/loja/produtos/${productId}/editar`);
  }

  await supabase.from("product_images").delete().eq("id", imageId);

  const path = storagePathFromUrl(image.url, user.id);
  if (path) {
    await supabase.storage.from("marketplace").remove([path]);
  }

  if (product.image_url === image.url) {
    const { data: next } = await supabase
      .from("product_images")
      .select("url")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    await supabase.from("products").update({ image_url: next?.url ?? null }).eq("id", productId);
  }

  redirect(`/loja/produtos/${productId}/editar`);
}

/** Reorders the gallery (and recomputes the cover) via the reorder_product_images RPC. */
export async function reorderProductImages(formData: FormData) {
  const productId = formData.get("product_id");
  const orderedIds = formData.getAll("ordered_ids").filter((v): v is string => typeof v === "string" && v.length > 0);

  if (typeof productId !== "string" || !productId || orderedIds.length === 0) {
    redirect("/loja/produtos");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase.rpc("reorder_product_images", { p_product_id: productId, p_ordered_ids: orderedIds });

  redirect(`/loja/produtos/${productId}/editar`);
}
