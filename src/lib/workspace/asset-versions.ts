import type { SupabaseClient } from "@supabase/supabase-js";

import type { AssetStatus, HubAsset } from "@/types/database";

export type AssetVersionSummary = {
  id: string;
  name: string;
  public_url: string;
  type: HubAsset["type"];
  status: AssetStatus;
  created_at: string;
  isCurrent: boolean;
  versionNumber: number;
};

export function resolveAssetThreadRootId(asset: Pick<HubAsset, "id" | "variant_of">): string {
  return asset.variant_of ?? asset.id;
}

export async function getAssetVersionHistory(
  supabase: SupabaseClient,
  assetId: string,
): Promise<{ root: HubAsset; versions: AssetVersionSummary[] } | null> {
  const { data: asset } = await supabase
    .from("hub_assets")
    .select("*")
    .eq("id", assetId)
    .maybeSingle();

  if (!asset) return null;

  const rootId = resolveAssetThreadRootId(asset as HubAsset);

  const { data: root } = await supabase
    .from("hub_assets")
    .select("*")
    .eq("id", rootId)
    .maybeSingle();

  if (!root) return null;

  const { data: variants } = await supabase
    .from("hub_assets")
    .select("*")
    .eq("variant_of", rootId)
    .order("created_at", { ascending: true });

  const archived = (variants ?? []) as HubAsset[];
  const versions: AssetVersionSummary[] = [
    ...archived.map((row, index) => ({
      id: row.id,
      name: row.name,
      public_url: row.public_url,
      type: row.type,
      status: row.status,
      created_at: row.created_at,
      isCurrent: false,
      versionNumber: index + 1,
    })),
    {
      id: root.id,
      name: root.name,
      public_url: root.public_url,
      type: root.type as HubAsset["type"],
      status: root.status,
      created_at: root.created_at,
      isCurrent: true,
      versionNumber: archived.length + 1,
    },
  ];

  return { root: root as HubAsset, versions };
}

export async function getAssetVersionCounts(
  supabase: SupabaseClient,
  rootAssetIds: string[],
): Promise<Record<string, number>> {
  const counts: Record<string, number> = Object.fromEntries(
    rootAssetIds.map((id) => [id, 1]),
  );
  if (!rootAssetIds.length) return counts;

  const { data } = await supabase
    .from("hub_assets")
    .select("variant_of")
    .in("variant_of", rootAssetIds);

  for (const row of data ?? []) {
    if (!row.variant_of) continue;
    counts[row.variant_of] = (counts[row.variant_of] ?? 1) + 1;
  }

  return counts;
}
