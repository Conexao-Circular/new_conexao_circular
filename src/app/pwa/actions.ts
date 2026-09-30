"use server";

import { createClient } from "@/lib/supabase/server";
import { sendToSubscriptions, type PushPayload } from "@/lib/push";

type BrowserSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function subscribeToPush(sub: BrowserSubscription, userAgent?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "unauthenticated" };

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      profile_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: userAgent ?? null,
    },
    { onConflict: "endpoint" },
  );

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function unsubscribeFromPush(endpoint: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "unauthenticated" };

  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return { ok: true as const };
}

/** Sends a notification to the signed-in user's own devices (self-test). */
export async function sendTestNotification() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "unauthenticated" };

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("profile_id", user.id);

  const payload: PushPayload = {
    title: "Conexão Circular",
    body: "Notificações ativadas com sucesso! 🌱",
    url: "/inicio",
  };

  const { sent, staleEndpoints } = await sendToSubscriptions(subs ?? [], payload);

  if (staleEndpoints.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
  }

  return { ok: true as const, sent };
}
