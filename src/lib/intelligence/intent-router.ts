import type { IntelligenceTemplateId } from "@/lib/intelligence/types";

const COLLATERAL_KEYWORDS = [
  "collateral",
  "collaterals",
  "asset",
  "assets",
  "file",
  "files",
  "document",
  "documents",
  "media",
  "creative",
];

const REVIEW_KEYWORDS = [
  "review",
  "approved",
  "rejected",
  "pending",
  "feedback",
  "approval",
  "status",
];

const BLOCKING_KEYWORDS = [
  "block",
  "blocking",
  "stuck",
  "overdue",
  "delay",
  "waiting",
  "urgent",
  "priority",
];

export function resolveIntelligenceTemplate(
  prompt: string,
  explicitTemplate?: IntelligenceTemplateId | null,
): IntelligenceTemplateId {
  if (explicitTemplate) return explicitTemplate;

  const normalized = prompt.trim().toLowerCase();
  if (!normalized) return "full";

  if (COLLATERAL_KEYWORDS.some((word) => normalized.includes(word))) {
    return "collaterals";
  }
  if (REVIEW_KEYWORDS.some((word) => normalized.includes(word))) {
    return "review";
  }
  if (BLOCKING_KEYWORDS.some((word) => normalized.includes(word))) {
    return "blocking";
  }

  return "full";
}

export function isIntelligenceIntent(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return false;

  if (normalized.startsWith("?") || normalized.startsWith("ask ")) {
    return true;
  }

  const starters = [
    "summarize",
    "summary",
    "what collaterals",
    "what's blocking",
    "whats blocking",
    "show me",
    "tell me about",
    "brief me",
    "project brief",
    "what do we have",
  ];

  return starters.some((starter) => normalized.startsWith(starter));
}

export function stripIntelligencePrefix(query: string): string {
  return query.trim().replace(/^\?+\s*/, "").replace(/^ask\s+/i, "").trim();
}
