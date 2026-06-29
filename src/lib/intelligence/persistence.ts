import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import {
  getSupabaseErrorMessage,
  isMissingIntelligenceSchemaError,
} from "@/lib/intelligence/errors";
import type { ContentIndexRow, ProjectBrief } from "@/lib/intelligence/types";
import { PROJECT_BRIEF_VERSION } from "@/lib/intelligence/types";

type ExistingBriefRow = {
  content_hash: string;
  snapshot: ProjectBrief;
};

export async function loadCachedProjectBrief(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ExistingBriefRow | null> {
  const { data, error } = await supabase
    .from("hub_project_briefs")
    .select("content_hash, snapshot")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) {
    if (isMissingIntelligenceSchemaError(error)) return null;
    throw new Error(getSupabaseErrorMessage(error));
  }

  return (data as ExistingBriefRow | null) ?? null;
}

export async function persistProjectBriefSnapshot(
  supabase: SupabaseClient,
  projectId: string,
  brief: ProjectBrief,
  contentHash: string,
  indexRows: ContentIndexRow[],
): Promise<void> {
  const started = Date.now();

  const { error: deleteError } = await supabase
    .from("hub_content_index")
    .delete()
    .eq("project_id", projectId);

  if (deleteError && !isMissingIntelligenceSchemaError(deleteError)) {
    throw new Error(getSupabaseErrorMessage(deleteError));
  }

  if (!deleteError && indexRows.length > 0) {
    const chunkSize = 200;
    for (let index = 0; index < indexRows.length; index += chunkSize) {
      const chunk = indexRows.slice(index, index + chunkSize);
      const { error: indexError } = await supabase
        .from("hub_content_index")
        .insert(chunk);

      if (indexError) {
        throw new Error(getSupabaseErrorMessage(indexError));
      }
    }
  }

  const buildDurationMs = Date.now() - started;
  const staleAfter = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error: upsertError } = await supabase.from("hub_project_briefs").upsert(
    {
      project_id: projectId,
      snapshot: brief,
      snapshot_version: PROJECT_BRIEF_VERSION,
      content_hash: contentHash,
      built_at: brief.generatedAt,
      stale_after: staleAfter,
      build_duration_ms: buildDurationMs,
    },
    { onConflict: "project_id" },
  );

  if (upsertError) {
    throw new Error(getSupabaseErrorMessage(upsertError));
  }
}

export async function tryPersistProjectBriefSnapshot(
  supabase: SupabaseClient,
  projectId: string,
  brief: ProjectBrief,
  contentHash: string,
  indexRows: ContentIndexRow[],
): Promise<boolean> {
  try {
    await persistProjectBriefSnapshot(
      supabase,
      projectId,
      brief,
      contentHash,
      indexRows,
    );
    return true;
  } catch (error) {
    if (isMissingIntelligenceSchemaError(error)) {
      return false;
    }
    throw error;
  }
}

export function throwIfSupabaseError(
  error: PostgrestError | null,
  label: string,
): void {
  if (!error) return;
  throw new Error(`${label}: ${getSupabaseErrorMessage(error)}`);
}
