import type { SupabaseClient } from "@supabase/supabase-js";

import type { HubShareLink } from "@/types/database";

import type { ResolvedShare } from "./types";

export async function resolveShareToken(
  supabase: SupabaseClient,
  token: string,
): Promise<ResolvedShare> {
  const { data, error } = await supabase.rpc("hub_resolve_share_token", {
    p_token: token,
  });

  if (error) throw error;
  return data as ResolvedShare;
}

export async function recordShareView(
  supabase: SupabaseClient,
  token: string,
  viewerKey?: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("hub_record_share_view", {
    p_token: token,
    p_viewer_key: viewerKey ?? "anonymous",
  });

  if (error) throw error;
  return Boolean(data);
}

export async function getShareLinksForProject(
  supabase: SupabaseClient,
  projectId: string,
): Promise<HubShareLink[]> {
  const { data, error } = await supabase
    .from("hub_share_links")
    .select("*")
    .eq("project_id", projectId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as HubShareLink[];
}

export async function getShareLinksForScope(
  supabase: SupabaseClient,
  projectId: string,
  scopeType: HubShareLink["scope_type"],
  scopeId: string,
): Promise<HubShareLink[]> {
  const { data, error } = await supabase
    .from("hub_share_links")
    .select("*")
    .eq("project_id", projectId)
    .eq("scope_type", scopeType)
    .eq("scope_id", scopeId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as HubShareLink[];
}
