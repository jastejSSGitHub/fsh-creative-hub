import type { PostgrestError } from "@supabase/supabase-js";

export function getSupabaseErrorMessage(
  error: PostgrestError | null | undefined,
): string {
  if (!error) return "";
  return error.message ?? error.details ?? error.hint ?? "";
}

export function isMissingIntelligenceSchemaError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message?: string }).message ?? "")
        : String(error);

  return /hub_project_briefs|hub_content_index|hub_content_source_kind|schema cache|does not exist|Could not find the table/i.test(
    message,
  );
}

export function toIntelligenceErrorMessage(error: unknown): string {
  if (isMissingIntelligenceSchemaError(error)) {
    return "Project intelligence storage is not set up yet. Run migration 023_hub_project_intelligence.sql.";
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message?: string }).message ?? "")
        : "";

  if (message && message.length < 160 && !/violates/i.test(message)) {
    return message;
  }

  return "Could not build project brief.";
}
