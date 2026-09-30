import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
};

export type StoredSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

let configured = false;

/**
 * Returns the configured web-push client, or null when VAPID keys are not set
 * in the environment (so push is a no-op in dev/preview without keys).
 */
function getWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:contato@conexaocircular.com.br";

  if (!publicKey || !privateKey) return null;

  if (!configured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  }
  return webpush;
}

/**
 * Best-effort delivery to a set of subscriptions. Returns the endpoints that
 * are gone (410/404) so the caller can prune them.
 */
export async function sendToSubscriptions(
  subs: StoredSubscription[],
  payload: PushPayload,
): Promise<{ sent: number; staleEndpoints: string[] }> {
  const client = getWebPush();
  if (!client || subs.length === 0) return { sent: 0, staleEndpoints: [] };

  const body = JSON.stringify(payload);
  const staleEndpoints: string[] = [];
  let sent = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await client.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        );
        sent += 1;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.push(sub.endpoint);
        }
      }
    }),
  );

  return { sent, staleEndpoints };
}

export function isPushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
  );
}

/**
 * Sends a push notification to another user (cross-user), reading their
 * subscriptions with the service-role client. No-op when push or the service
 * role key is not configured — safe to call from any server action.
 */
export async function notifyProfile(profileId: string, payload: PushPayload) {
  const admin = createAdminClient();
  if (!admin) return;

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("profile_id", profileId);

  const { staleEndpoints } = await sendToSubscriptions(subs ?? [], payload);

  if (staleEndpoints.length > 0) {
    await admin.from("push_subscriptions").delete().in("endpoint", staleEndpoints);
  }
}
