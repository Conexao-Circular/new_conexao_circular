import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/types";

export async function recordAgentEvent(
  supabase: SupabaseClient<Database>,
  agentId: string,
  eventName: string,
  metadata: Record<string, Json> = {},
) {
  const { error } = await supabase.from("agent_analytics_events").insert({
    agent_id: agentId,
    event_name: eventName,
    metadata,
  });
  if (error) console.error("[agent-analytics]", error.message);
}
