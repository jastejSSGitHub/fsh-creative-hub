import { sortForYouItems } from "@/lib/inbox/priority";
import type { ForYouItem } from "@/lib/inbox/queries";
import type { SharedProjectNode } from "@/lib/inbox/sidebar-queries";
import type { TaskWithMeta } from "@/lib/tasks/types";
import type { HubLabel } from "@/types/database";

/** Stable mock IDs — prefixed so UI can noop writes against the API. */
export const MOCK_PREFIX = "mock-demo-";

export const MOCK_PROJECT = {
  id: "00000000-0000-4000-a000-000000000001",
  name: "Blenz Rebrand",
} as const;

export const MOCK_INITIATIVE = {
  id: "00000000-0000-4000-a000-000000000002",
  name: "Summer Menu",
} as const;

export const MOCK_ASSET = {
  id: "00000000-0000-4000-a000-000000000003",
  name: "Menu Poster v3",
  public_url: null as string | null,
} as const;

const SANDEEP = {
  id: "00000000-0000-4000-a000-000000000101",
  display_name: "Sandeep",
  avatar_url: null as string | null,
};

const PREETI = {
  id: "00000000-0000-4000-a000-000000000102",
  display_name: "Preeti",
  avatar_url: null as string | null,
};

const ALEX = {
  id: "00000000-0000-4000-a000-000000000103",
  display_name: "Alex (Design)",
  avatar_url: null as string | null,
};

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();
}

function daysFromNow(d: number): string {
  const date = new Date();
  date.setDate(date.getDate() + d);
  date.setHours(17, 0, 0, 0);
  return date.toISOString();
}

export function isMockDemoId(id: string): boolean {
  return id.startsWith(MOCK_PREFIX) || id.startsWith("00000000-0000-4000-a000-");
}

export function getMockForYouItems(): ForYouItem[] {
  const now = new Date().toISOString();

  const items: ForYouItem[] = [
    {
      id: `${MOCK_PREFIX}task_overdue:1`,
      kind: "task_overdue",
      sort_at: daysAgo(1),
      task: {
        id: `${MOCK_PREFIX}task-1`,
        name: "Fix headline sizing on mobile",
        project_id: MOCK_PROJECT.id,
        due_at: daysAgo(1),
        created_at: daysAgo(3),
      },
      project: { ...MOCK_PROJECT, is_org_wide: false },
      assigner: SANDEEP,
    },
    {
      id: `${MOCK_PREFIX}mention:1`,
      kind: "mention",
      sort_at: hoursAgo(2),
      comment: {
        id: `${MOCK_PREFIX}comment-1`,
        asset_id: MOCK_ASSET.id,
        parent_id: null,
        author_id: PREETI.id,
        body: "@you Can we bump the logo on the summer poster? Feels small next to the headline.",
        mentions: [],
        resolved: false,
        linked_task_id: null,
        created_at: hoursAgo(2),
        author: PREETI,
      },
      asset: { ...MOCK_ASSET, initiative_id: MOCK_INITIATIVE.id },
      initiative: { ...MOCK_INITIATIVE, project_id: MOCK_PROJECT.id },
      project: MOCK_PROJECT,
    },
    {
      id: `${MOCK_PREFIX}task_mention:1`,
      kind: "task_mention",
      sort_at: hoursAgo(4),
      comment: {
        id: `${MOCK_PREFIX}task-comment-1`,
        body: "@you Updated the brief — can you review before we send to print?",
        created_at: hoursAgo(4),
        author: SANDEEP,
      },
      task: {
        id: `${MOCK_PREFIX}task-2`,
        name: "Review print specs",
        project_id: MOCK_PROJECT.id,
      },
      project: MOCK_PROJECT,
    },
    {
      id: `${MOCK_PREFIX}task_assigned:1`,
      kind: "task_assigned",
      sort_at: daysFromNow(0),
      task: {
        id: `${MOCK_PREFIX}task-3`,
        name: "Prep client presentation deck",
        project_id: MOCK_PROJECT.id,
        due_at: daysFromNow(0),
        created_at: daysAgo(1),
      },
      project: MOCK_PROJECT,
      assigner: PREETI,
    },
    {
      id: `${MOCK_PREFIX}vote:1`,
      kind: "vote_requested",
      sort_at: hoursAgo(6),
      asset: { ...MOCK_ASSET, initiative_id: MOCK_INITIATIVE.id },
      initiative: { ...MOCK_INITIATIVE, project_id: MOCK_PROJECT.id },
      project: MOCK_PROJECT,
    },
    {
      id: `${MOCK_PREFIX}upload:1`,
      kind: "upload_thread",
      sort_at: hoursAgo(8),
      comment: {
        id: `${MOCK_PREFIX}comment-2`,
        asset_id: MOCK_ASSET.id,
        parent_id: null,
        author_id: ALEX.id,
        body: "Love the color direction — one note on the CTA placement.",
        mentions: [],
        resolved: false,
        linked_task_id: null,
        created_at: hoursAgo(8),
        author: ALEX,
      },
      asset: { ...MOCK_ASSET, initiative_id: MOCK_INITIATIVE.id },
      initiative: { ...MOCK_INITIATIVE, project_id: MOCK_PROJECT.id },
      project: MOCK_PROJECT,
    },
    {
      id: `${MOCK_PREFIX}task_waiting:1`,
      kind: "task_waiting",
      sort_at: daysAgo(2),
      task: {
        id: `${MOCK_PREFIX}task-4`,
        name: "Client sign-off on hero image",
        project_id: MOCK_PROJECT.id,
        due_at: daysFromNow(2),
        created_at: daysAgo(2),
      },
      project: MOCK_PROJECT,
      assigner: ALEX,
    },
    {
      id: `${MOCK_PREFIX}following:1`,
      kind: "following",
      sort_at: hoursAgo(12),
      comment: {
        id: `${MOCK_PREFIX}task-comment-2`,
        body: "Dropped notes on the alternate layout — curious what you think.",
        created_at: hoursAgo(12),
        author: ALEX,
      },
      task: {
        id: `${MOCK_PREFIX}task-5`,
        name: "Explore alternate layout",
        project_id: MOCK_PROJECT.id,
      },
      project: MOCK_PROJECT,
    },
    {
      id: `${MOCK_PREFIX}resolve:1`,
      kind: "resolve_suggested",
      sort_at: hoursAgo(1),
      comment: {
        id: `${MOCK_PREFIX}comment-3`,
        body: "Headline too small on mobile",
        asset_id: MOCK_ASSET.id,
      },
      task: { id: `${MOCK_PREFIX}task-6`, name: "Increase mobile headline size" },
      asset: MOCK_ASSET,
      project: MOCK_PROJECT,
      initiative: MOCK_INITIATIVE,
    },
    {
      id: `${MOCK_PREFIX}mention:reply`,
      kind: "mention",
      sort_at: hoursAgo(3),
      comment: {
        id: `${MOCK_PREFIX}comment-reply`,
        asset_id: MOCK_ASSET.id,
        parent_id: `${MOCK_PREFIX}comment-1`,
        author_id: SANDEEP.id,
        body: "@you Agreed — let's align with the brand guide before final.",
        mentions: [],
        resolved: false,
        linked_task_id: null,
        created_at: hoursAgo(3),
        author: SANDEEP,
      },
      asset: { ...MOCK_ASSET, initiative_id: MOCK_INITIATIVE.id },
      initiative: { ...MOCK_INITIATIVE, project_id: MOCK_PROJECT.id },
      project: MOCK_PROJECT,
    },
    {
      id: `${MOCK_PREFIX}inbox-task:1`,
      kind: "task_assigned",
      sort_at: now,
      task: {
        id: `${MOCK_PREFIX}task-inbox`,
        name: "Personal: follow up with printer",
        project_id: null,
        due_at: daysFromNow(1),
        created_at: hoursAgo(5),
      },
      project: null,
      assigner: null,
    },
  ];

  return sortForYouItems(items);
}

export function getMockForYouCount(): number {
  return getMockForYouItems().filter((item) =>
    [
      "mention",
      "task_mention",
      "task_assigned",
      "task_overdue",
      "vote_requested",
      "resolve_suggested",
    ].includes(item.kind),
  ).length;
}

export function getMockTasks(
  userId: string,
  userDisplayName: string,
  labels: HubLabel[],
): TaskWithMeta[] {
  const designLabel = labels.find((l) => l.name === "design");
  const clientLabel = labels.find((l) => l.name === "client");

  const me = {
    id: userId,
    display_name: userDisplayName,
    avatar_url: null as string | null,
  };

  return [
    {
      id: `${MOCK_PREFIX}task-1`,
      project_id: MOCK_PROJECT.id,
      section_id: null,
      parent_id: null,
      name: "Fix headline sizing on mobile",
      description: "From feedback on Menu Poster v3",
      due_at: daysAgo(1),
      priority: 2,
      assignee_id: userId,
      recurring_rule: null,
      completed: false,
      completed_at: null,
      created_by: SANDEEP.id,
      sort_order: 0,
      created_at: daysAgo(3),
      labels: designLabel ? [designLabel] : [],
      assignee: me,
      project: MOCK_PROJECT,
    },
    {
      id: `${MOCK_PREFIX}task-2`,
      project_id: MOCK_PROJECT.id,
      section_id: null,
      parent_id: null,
      name: "Review print specs",
      description: null,
      due_at: daysFromNow(1),
      priority: 3,
      assignee_id: userId,
      recurring_rule: null,
      completed: false,
      completed_at: null,
      created_by: SANDEEP.id,
      sort_order: 1,
      created_at: daysAgo(2),
      labels: clientLabel ? [clientLabel] : [],
      assignee: me,
      project: MOCK_PROJECT,
    },
    {
      id: `${MOCK_PREFIX}task-3`,
      project_id: MOCK_PROJECT.id,
      section_id: null,
      parent_id: null,
      name: "Prep client presentation deck",
      description: null,
      due_at: daysFromNow(0),
      priority: 3,
      assignee_id: userId,
      recurring_rule: null,
      completed: false,
      completed_at: null,
      created_by: PREETI.id,
      sort_order: 2,
      created_at: daysAgo(1),
      labels: [],
      assignee: me,
      project: MOCK_PROJECT,
    },
    {
      id: `${MOCK_PREFIX}task-inbox`,
      project_id: null,
      section_id: null,
      parent_id: null,
      name: "Follow up with printer",
      description: "Personal reminder",
      due_at: daysFromNow(1),
      priority: 4,
      assignee_id: userId,
      recurring_rule: null,
      completed: false,
      completed_at: null,
      created_by: userId,
      sort_order: 0,
      created_at: hoursAgo(5),
      labels: [],
      assignee: me,
      project: null,
    },
    {
      id: `${MOCK_PREFIX}task-4`,
      project_id: MOCK_PROJECT.id,
      section_id: null,
      parent_id: null,
      name: "Client sign-off on hero image",
      description: null,
      due_at: daysFromNow(2),
      priority: 3,
      assignee_id: ALEX.id,
      recurring_rule: null,
      completed: false,
      completed_at: null,
      created_by: userId,
      sort_order: 3,
      created_at: daysAgo(2),
      labels: clientLabel ? [clientLabel] : [],
      assignee: ALEX,
      project: MOCK_PROJECT,
    },
    {
      id: `${MOCK_PREFIX}task-5`,
      project_id: MOCK_PROJECT.id,
      section_id: null,
      parent_id: null,
      name: "Explore alternate layout",
      description: null,
      due_at: daysFromNow(3),
      priority: 4,
      assignee_id: ALEX.id,
      recurring_rule: null,
      completed: false,
      completed_at: null,
      created_by: ALEX.id,
      sort_order: 4,
      created_at: daysAgo(4),
      labels: designLabel ? [designLabel] : [],
      assignee: ALEX,
      project: MOCK_PROJECT,
    },
    {
      id: `${MOCK_PREFIX}task-6`,
      project_id: MOCK_PROJECT.id,
      section_id: null,
      parent_id: null,
      name: "Increase mobile headline size",
      description: "Linked to asset feedback thread",
      due_at: null,
      priority: 2,
      assignee_id: userId,
      recurring_rule: null,
      completed: true,
      completed_at: hoursAgo(1),
      created_by: userId,
      sort_order: 5,
      created_at: daysAgo(2),
      labels: designLabel ? [designLabel] : [],
      assignee: me,
      project: MOCK_PROJECT,
    },
  ];
}

export function getMockProjects(): { id: string; name: string }[] {
  return [MOCK_PROJECT, { id: "00000000-0000-4000-a000-000000000010", name: "FSH Website" }];
}

export function getMockSharedProjects(): SharedProjectNode[] {
  return [
    {
      id: MOCK_PROJECT.id,
      name: MOCK_PROJECT.name,
      href: `/projects/${MOCK_PROJECT.id}`,
      files: [
        {
          id: `${MOCK_PREFIX}board-1`,
          name: "Menu Review Board",
          type: "review_board" as const,
          href: `/projects/${MOCK_PROJECT.id}/boards/${MOCK_PREFIX}board-1`,
          canOpen: true,
        },
        {
          id: `${MOCK_PREFIX}doc-1`,
          name: "Campaign Brief",
          type: "text_document" as const,
          href: `/projects/${MOCK_PROJECT.id}/docs/${MOCK_PREFIX}doc-1`,
          canOpen: true,
        },
      ],
    },
  ];
}

export function getMockMembers(): Pick<
  import("@/types/database").HubProfile,
  "id" | "display_name" | "avatar_url"
>[] {
  return [SANDEEP, PREETI, ALEX];
}

export function getMockTaskComments(taskId: string) {
  if (!isMockDemoId(taskId)) return [];
  return [
    {
      id: `${MOCK_PREFIX}tc-1`,
      task_id: taskId,
      author_id: SANDEEP.id,
      body: "Flagging this before the client review tomorrow.",
      mentions: [],
      created_at: hoursAgo(6),
      author: SANDEEP,
    },
    {
      id: `${MOCK_PREFIX}tc-2`,
      task_id: taskId,
      author_id: PREETI.id,
      body: "@you Left a note on the asset — link is in the description.",
      mentions: [],
      created_at: hoursAgo(3),
      author: PREETI,
    },
  ];
}
