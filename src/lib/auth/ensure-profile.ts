import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { HubProfile } from "@/types/database";

/**
 * Ensures hub_profiles exists for the signed-in user (backup if trigger missed).
 */
export async function ensureHubProfile(user: User): Promise<HubProfile | null> {
  const metadata = user.user_metadata ?? {};
  const displayName =
    (metadata.full_name as string | undefined) ??
    (metadata.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "User";

  const payload = {
    id: user.id,
    email: user.email ?? "",
    display_name: displayName,
    avatar_url: (metadata.avatar_url as string | undefined) ?? null,
  };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hub_profiles")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    return null;
  }

  return data as HubProfile;
}
