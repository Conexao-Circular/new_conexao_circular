"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addToCart(formData: FormData) {
  const productId = formData.get("product_id") as string;
  const quantity = Math.min(Math.max(Math.trunc(Number(formData.get("quantity")) || 1), 1), 99);

  if (!productId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const newQty = Math.min(existing.quantity + quantity, 99);
    await supabase
      .from("cart_items")
      .update({ quantity: newQty, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("product_id", productId);
  } else {
    await supabase.from("cart_items").insert({ user_id: user.id, product_id: productId, quantity });
  }

  revalidatePath("/loja");
  revalidatePath(`/loja/${productId}`);
  revalidatePath("/loja/carrinho");
}

export async function updateCartQuantity(formData: FormData) {
  const productId = formData.get("product_id") as string;
  const quantity = Math.min(Math.max(Math.trunc(Number(formData.get("quantity")) || 1), 1), 99);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("cart_items")
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("product_id", productId);

  revalidatePath("/loja/carrinho");
}

export async function removeFromCart(formData: FormData) {
  const productId = formData.get("product_id") as string;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", productId);

  revalidatePath("/loja/carrinho");
}
