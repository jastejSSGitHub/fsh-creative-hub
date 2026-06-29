import { cache } from "react";
import { redirect } from "next/navigation";

import { LOGIN_PATH } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { HubProfile } from "@/types/database";

export type HubSession = {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  isHubAdmin: boolean;
  profile: HubProfile | null;
};

export const getHubSupabase = cache(async () => createClient());

export const getHubUser = cache(async () => {
  const supabase = await getHubSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
});

export const getHubProfile = cache(async (userId: string) => {
  const supabase = await getHubSupabase();
  const { data: profile } = await supabase
    .from("hub_profiles")
    .select("id, email, display_name, avatar_url, is_hub_admin, created_at")
    .eq("id", userId)
    .maybeSingle();
  return profile as HubProfile | null;
});

export async function requireHubSession(): Promise<HubSession> {
  const { user } = await getHubUser();

  if (!user) {
    redirect(LOGIN_PATH);
  }

  const profile = await getHubProfile(user.id);
  const displayName =
    profile?.display_name ??
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "User";

  return {
    userId: user.id,
    email: profile?.email ?? user.email ?? "",
    displayName,
    avatarUrl: profile?.avatar_url ?? null,
    isHubAdmin: profile?.is_hub_admin ?? false,
    profile,
  };
}
