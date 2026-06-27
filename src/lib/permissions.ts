import type { HubRole } from "@/types/database";

export function canVote(role: HubRole | null | undefined): boolean {
  return role != null;
}

export function canComment(role: HubRole | null | undefined): boolean {
  return role != null;
}

export function canEdit(role: HubRole | null | undefined): boolean {
  return role === "admin" || role === "editor";
}

export function canDeleteOwnAsset(
  role: HubRole | null | undefined,
  userId: string,
  uploadedBy: string,
): boolean {
  return canEdit(role) && userId === uploadedBy;
}

export function canAdmin(role: HubRole | null | undefined): boolean {
  return role === "admin";
}

export function roleLabel(role: HubRole): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "editor":
      return "Editor";
    case "viewer":
      return "Viewer";
  }
}
