const MEMBER_AVATAR_COLORS = [
  "#3A86FF",
  "#8338EC",
  "#118AB2",
  "#E07A5F",
  "#6366F1",
  "#DB2777",
  "#0891B2",
  "#7C3AED",
  "#059669",
  "#EA580C",
  "#2563EB",
  "#C026D3",
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function memberAvatarColor(seed: string): string {
  const normalized = seed.trim().toLowerCase();
  if (!normalized) return MEMBER_AVATAR_COLORS[0];
  return MEMBER_AVATAR_COLORS[hashString(normalized) % MEMBER_AVATAR_COLORS.length];
}
