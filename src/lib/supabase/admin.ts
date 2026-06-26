import { createClient } from "@supabase/supabase-js";

import { getPublicSupabaseEnv, getServiceRoleKey } from "@/lib/env";

/**
 * Service-role client for server-only admin tasks (migrations, invites, etc.).
 * Never import this module from client components.
 */
export function createAdminClient() {
  const serviceRoleKey = getServiceRoleKey();
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local for server admin tasks.",
    );
  }

  const { url } = getPublicSupabaseEnv();
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
