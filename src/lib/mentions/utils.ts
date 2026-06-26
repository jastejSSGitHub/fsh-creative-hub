import type { HubProfile } from "@/types/database";

export function mentionHandle(displayName: string): string {
  return displayName.replace(/\s+/g, "");
}

export type MentionRange = {
  query: string;
  start: number;
  end: number;
};

export function getMentionRangeAtCursor(
  text: string,
  cursor: number,
): MentionRange | null {
  const before = text.slice(0, cursor);
  const match = before.match(/@([\w.]*)$/);
  if (!match) return null;

  const start = cursor - match[0].length;
  return { query: match[1], start, end: cursor };
}

export function filterMembersForMention(
  members: HubProfile[],
  query: string,
  excludeUserId?: string,
): HubProfile[] {
  const normalized = query.toLowerCase();

  return members
    .filter((member) => {
      if (excludeUserId && member.id === excludeUserId) return false;
      const name = member.display_name.toLowerCase();
      const handle = mentionHandle(member.display_name).toLowerCase();
      if (!normalized) return true;
      return name.includes(normalized) || handle.includes(normalized);
    })
    .slice(0, 6);
}

export function parseMentionIds(
  text: string,
  members: HubProfile[],
): string[] {
  const ids: string[] = [];

  for (const member of members) {
    const handle = mentionHandle(member.display_name);
    if (
      text.includes(`@${handle}`) ||
      text.includes(`@${member.display_name}`)
    ) {
      ids.push(member.id);
    }
  }

  return [...new Set(ids)];
}
