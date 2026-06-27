import type { User } from "@supabase/supabase-js";

export function getDisplayNameFromUser(user: User): string {
  const metadata = user.user_metadata ?? {};
  const fromMetadata =
    (metadata.full_name as string | undefined) ??
    (metadata.name as string | undefined);

  if (typeof fromMetadata === "string" && fromMetadata.trim()) {
    return fromMetadata.trim();
  }

  const emailLocal = user.email?.split("@")[0]?.trim();
  if (emailLocal) {
    return emailLocal.charAt(0).toUpperCase() + emailLocal.slice(1);
  }

  return "there";
}

export function getFirstNameFromUser(user: User): string {
  return getDisplayNameFromUser(user).split(/\s+/)[0] ?? "there";
}
