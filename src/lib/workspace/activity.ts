import type { SupabaseClient } from "@supabase/supabase-js";

import type { ActivityTargetType, ActivityVerb } from "@/types/database";

export async function logActivity(
  supabase: SupabaseClient,
  input: {
    projectId: string;
    actorId: string;
    verb: ActivityVerb;
    targetType: ActivityTargetType;
    targetId: string;
    summary: string;
  },
) {
  await supabase.from("hub_activity").insert({
    project_id: input.projectId,
    actor_id: input.actorId,
    verb: input.verb,
    target_type: input.targetType,
    summary: input.summary,
    target_id: input.targetId,
  });
}
