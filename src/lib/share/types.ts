import type { AssetStatus, AssetType, ShareLinkConfig, ShareLinkScopeType } from "@/types/database";

export type SharePublicAsset = {
  id: string;
  name: string;
  type: AssetType;
  public_url: string;
  tag: string;
  status: AssetStatus;
  sort_order: number;
  initiative_name?: string;
};

export type SharePublicComment = {
  id: string;
  body: string;
  created_at: string;
  author_name: string;
  resolved: boolean;
};

export type ResolvedSharePayload = {
  ok: true;
  link_id: string;
  scope_type: ShareLinkScopeType;
  config: ShareLinkConfig;
  project_name: string;
  initiative_name: string | null;
  shared_by: string | null;
  assets: SharePublicAsset[];
  comments: SharePublicComment[];
};

export type ResolvedShareError = {
  ok: false;
  reason: string;
};

export type ResolvedShare = ResolvedSharePayload | ResolvedShareError;

export function sharePath(token: string): `/share/${string}` {
  return `/share/${token}`;
}

export function shareUrl(token: string, siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, "")}${sharePath(token)}`;
}

export const SHARE_EXPIRY_OPTIONS = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "never", label: "Never", days: null },
] as const;

export type ShareExpiryOptionId = (typeof SHARE_EXPIRY_OPTIONS)[number]["id"];

export function expiryDateForOption(optionId: ShareExpiryOptionId): string | null {
  const option = SHARE_EXPIRY_OPTIONS.find((o) => o.id === optionId);
  if (!option || option.days == null) return null;
  const date = new Date();
  date.setDate(date.getDate() + option.days);
  return date.toISOString();
}
