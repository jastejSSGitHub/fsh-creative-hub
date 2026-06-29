import { sortForYouItems } from "@/lib/inbox/priority";
import type { ForYouItem } from "@/lib/inbox/queries";
import type { SharedProjectNode } from "@/lib/inbox/sidebar-queries";
import type { ResolvedShare } from "@/lib/share/types";
import { CREATIVE_WORKFLOW_SECTION_NAMES } from "@/lib/tasks/constants";
import type { SectionWithTasks, TaskWithMeta } from "@/lib/tasks/types";
import type { AssetWithVotes, ActivityWithActor, CommentWithAuthor } from "@/lib/workspace/queries";
import { EMPTY_CONSENSUS } from "@/lib/assets/consensus";
import type {
  HubInitiative,
  HubLabel,
  HubProject,
  HubRole,
  HubShareLink,
  ShareLinkScopeType,
} from "@/types/database";

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

export const MOCK_BOARD = {
  id: `${MOCK_PREFIX}board-1`,
  name: "Menu Review Board",
} as const;

/** Public share tokens — only resolve in development demo mode. */
export const MOCK_SHARE_TOKEN_PRESENTATION = "mock-demo-share-summer-reel";
export const MOCK_SHARE_TOKEN_ASSET = "mock-demo-share-poster-v3";

export const MOCK_ASSET = {
  id: "00000000-0000-4000-a000-000000000003",
  name: "Menu Poster v3",
  public_url: "/media/capabilities/graphics/sutlej.png",
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

export function isMockProjectId(projectId: string): boolean {
  return projectId === MOCK_PROJECT.id;
}

export function isMockShareToken(token: string): boolean {
  return token.startsWith("mock-demo-share-");
}

export function isMockShareDemoEnabled(): boolean {
  return process.env.NODE_ENV === "development";
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

function mockSectionId(index: number): string {
  return `${MOCK_PREFIX}section-${index}`;
}

/** Project board columns + tasks for creative workflow demo. */
export function getMockProjectBoardData(
  projectId: string,
  projectName: string,
  userId: string,
  userDisplayName: string,
  labels: HubLabel[],
): { sections: SectionWithTasks[]; tasks: TaskWithMeta[] } {
  const designLabel = labels.find((l) => l.name === "design");
  const clientLabel = labels.find((l) => l.name === "client");
  const project = { id: projectId, name: projectName };
  const me = {
    id: userId,
    display_name: userDisplayName,
    avatar_url: null as string | null,
  };

  const sections: SectionWithTasks[] = CREATIVE_WORKFLOW_SECTION_NAMES.map((name, index) => ({
    id: mockSectionId(index),
    project_id: projectId,
    name,
    sort_order: index,
    created_at: daysAgo(14),
    tasks: [],
  }));

  const sectionIds = {
    notStarted: mockSectionId(0),
    inProgress: mockSectionId(1),
    inReview: mockSectionId(2),
    waitingOnClient: mockSectionId(3),
    done: mockSectionId(4),
  };

  const tasks: TaskWithMeta[] = [
    {
      id: `${MOCK_PREFIX}board-task-1`,
      project_id: projectId,
      section_id: sectionIds.notStarted,
      parent_id: null,
      name: "Gather brand references",
      description: null,
      due_at: daysFromNow(4),
      priority: 4,
      assignee_id: ALEX.id,
      recurring_rule: null,
      completed: false,
      completed_at: null,
      created_by: userId,
      sort_order: 0,
      created_at: daysAgo(5),
      labels: designLabel ? [designLabel] : [],
      assignee: ALEX,
      project,
    },
    {
      id: `${MOCK_PREFIX}board-task-2`,
      project_id: projectId,
      section_id: sectionIds.notStarted,
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
      sort_order: 1,
      created_at: daysAgo(4),
      labels: designLabel ? [designLabel] : [],
      assignee: ALEX,
      project,
    },
    {
      id: `${MOCK_PREFIX}board-task-3`,
      project_id: projectId,
      section_id: sectionIds.inProgress,
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
      project,
    },
    {
      id: `${MOCK_PREFIX}board-task-4`,
      project_id: projectId,
      section_id: sectionIds.inProgress,
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
      project,
    },
    {
      id: `${MOCK_PREFIX}board-task-5`,
      project_id: projectId,
      section_id: sectionIds.inReview,
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
      sort_order: 0,
      created_at: daysAgo(1),
      labels: [],
      assignee: me,
      project,
    },
    {
      id: `${MOCK_PREFIX}board-task-6`,
      project_id: projectId,
      section_id: sectionIds.waitingOnClient,
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
      sort_order: 0,
      created_at: daysAgo(2),
      labels: clientLabel ? [clientLabel] : [],
      assignee: ALEX,
      project,
    },
    {
      id: `${MOCK_PREFIX}board-task-7`,
      project_id: projectId,
      section_id: sectionIds.done,
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
      sort_order: 0,
      created_at: daysAgo(2),
      labels: designLabel ? [designLabel] : [],
      assignee: me,
      project,
    },
  ];

  const sectionsWithTasks = sections.map((section) => ({
    ...section,
    tasks: tasks.filter((task) => task.section_id === section.id),
  }));

  return { sections: sectionsWithTasks, tasks };
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

// ---------------------------------------------------------------------------
// Review board & client share (Wave 1 demo data)
// ---------------------------------------------------------------------------

const MOCK_ASSET_DEFS = [
  {
    id: MOCK_ASSET.id,
    name: MOCK_ASSET.name,
    type: "image" as const,
    public_url: MOCK_ASSET.public_url,
    tag: "v3",
    status: "final" as const,
    sort_order: 0,
  },
  {
    id: "00000000-0000-4000-a000-000000000004",
    name: "Summer Hero Banner",
    type: "image" as const,
    public_url: "/media/capabilities/presentation/presentation1.png",
    tag: "Hero",
    status: "approved" as const,
    sort_order: 1,
  },
  {
    id: "00000000-0000-4000-a000-000000000005",
    name: "In-store Display",
    type: "image" as const,
    public_url: "/media/capabilities/website/coffee-website.png",
    tag: "Retail",
    status: "approved" as const,
    sort_order: 2,
  },
  {
    id: "00000000-0000-4000-a000-000000000006",
    name: "Brand Film Cut",
    type: "video" as const,
    public_url: "/media/capabilities/film/td-video.mp4",
    tag: "Video",
    status: "approved" as const,
    sort_order: 3,
  },
];

function buildMockAssetWithVotes(
  def: (typeof MOCK_ASSET_DEFS)[number],
  initiativeId: string,
  uploadedBy: string,
): AssetWithVotes {
  return {
    id: def.id,
    initiative_id: initiativeId,
    name: def.name,
    type: def.type,
    storage_path: def.public_url,
    public_url: def.public_url,
    tag: def.tag,
    status: def.status,
    uploaded_by: uploadedBy,
    sort_order: def.sort_order,
    variant_of: null,
    is_fix_candidate: false,
    legacy_approved_by: null,
    created_at: daysAgo(5),
    votes: [],
    consensus: EMPTY_CONSENSUS,
    versionCount: def.id === MOCK_ASSET.id ? 3 : 1,
  };
}

export function getMockWorkspaceAssets(initiativeId?: string): AssetWithVotes[] {
  const initiative = initiativeId ?? MOCK_INITIATIVE.id;
  return MOCK_ASSET_DEFS.map((def) =>
    buildMockAssetWithVotes(def, initiative, PREETI.id),
  );
}

export function getMockProjectRecord(userId: string): HubProject {
  const now = new Date().toISOString();
  return {
    id: MOCK_PROJECT.id,
    name: MOCK_PROJECT.name,
    description: "Summer menu refresh — client review & share links demo",
    cover_url: null,
    is_org_wide: false,
    created_by: userId,
    created_at: daysAgo(30),
    trashed_at: null,
    updated_at: now,
  };
}

export function getMockInitiativesForBoard(): HubInitiative[] {
  return [
    {
      id: MOCK_INITIATIVE.id,
      project_id: MOCK_PROJECT.id,
      review_board_id: MOCK_BOARD.id,
      name: MOCK_INITIATIVE.name,
      description: null,
      sort_order: 0,
      created_at: daysAgo(20),
    },
    {
      id: "00000000-0000-4000-a000-000000000007",
      project_id: MOCK_PROJECT.id,
      review_board_id: MOCK_BOARD.id,
      name: "Social Pack",
      description: null,
      sort_order: 1,
      created_at: daysAgo(18),
    },
  ];
}

export function getMockProjectMembersWithRoles(): Array<{
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  is_hub_admin: boolean;
  created_at: string;
  role: HubRole;
}> {
  const now = new Date().toISOString();
  return [
    { ...SANDEEP, email: "sandeep@fshdesign.org", is_hub_admin: false, created_at: now, role: "admin" },
    { ...PREETI, email: "preeti@fshdesign.org", is_hub_admin: false, created_at: now, role: "editor" },
    { ...ALEX, email: "alex@fshdesign.org", is_hub_admin: false, created_at: now, role: "editor" },
  ];
}

export function getMockActivityFeed(
  userId: string,
  userDisplayName: string,
): ActivityWithActor[] {
  const me = {
    id: userId,
    display_name: userDisplayName,
    avatar_url: null as string | null,
  };

  return [
    {
      id: `${MOCK_PREFIX}activity-shared`,
      project_id: MOCK_PROJECT.id,
      actor_id: userId,
      verb: "shared",
      target_type: "initiative",
      target_id: MOCK_INITIATIVE.id,
      summary: `Shared Summer Menu reel via link`,
      created_at: hoursAgo(3),
      actor: me,
    },
    {
      id: `${MOCK_PREFIX}activity-shared-asset`,
      project_id: MOCK_PROJECT.id,
      actor_id: PREETI.id,
      verb: "shared",
      target_type: "asset",
      target_id: MOCK_ASSET.id,
      summary: "Shared Menu Poster v3 with client (comments on)",
      created_at: hoursAgo(8),
      actor: PREETI,
    },
    {
      id: `${MOCK_PREFIX}activity-final`,
      project_id: MOCK_PROJECT.id,
      actor_id: SANDEEP.id,
      verb: "final",
      target_type: "asset",
      target_id: MOCK_ASSET.id,
      summary: "Marked Menu Poster v3 as final pick",
      created_at: daysAgo(1),
      actor: SANDEEP,
    },
    {
      id: `${MOCK_PREFIX}activity-comment`,
      project_id: MOCK_PROJECT.id,
      actor_id: PREETI.id,
      verb: "commented",
      target_type: "asset",
      target_id: MOCK_ASSET.id,
      summary: "Commented on Menu Poster v3",
      created_at: hoursAgo(2),
      actor: PREETI,
    },
  ];
}

export function getMockAssetComments(assetId: string): CommentWithAuthor[] {
  if (!isMockDemoId(assetId)) return [];

  return [
    {
      id: `${MOCK_PREFIX}comment-1`,
      asset_id: assetId,
      parent_id: null,
      author_id: PREETI.id,
      body: "@you Can we bump the logo on the summer poster? Feels small next to the headline.",
      mentions: [],
      resolved: false,
      linked_task_id: `${MOCK_PREFIX}task-1`,
      created_at: hoursAgo(2),
      author: PREETI,
      replies: [
        {
          id: `${MOCK_PREFIX}comment-reply`,
          asset_id: assetId,
          parent_id: `${MOCK_PREFIX}comment-1`,
          author_id: SANDEEP.id,
          body: "Good catch — I'll send a client share link with comments on so they can weigh in.",
          mentions: [],
          resolved: false,
          linked_task_id: null,
          created_at: hoursAgo(1.5),
          author: SANDEEP,
          replies: [],
        },
      ],
    },
    {
      id: `${MOCK_PREFIX}comment-client-note`,
      asset_id: assetId,
      parent_id: null,
      author_id: ALEX.id,
      body: "Love the color direction — CTA could sit higher on mobile.",
      mentions: [],
      resolved: false,
      linked_task_id: null,
      created_at: hoursAgo(8),
      author: ALEX,
      replies: [],
    },
  ];
}

let mockShareLinkOverrides: HubShareLink[] = [];
const mockShareLinkRevoked = new Set<string>();

export function resetMockShareLinkOverrides() {
  mockShareLinkOverrides = [];
  mockShareLinkRevoked.clear();
}

export function addMockShareLinkOverride(link: HubShareLink) {
  mockShareLinkOverrides = [link, ...mockShareLinkOverrides];
}

export function revokeMockShareLink(linkId: string) {
  mockShareLinkRevoked.add(linkId);
  mockShareLinkOverrides = mockShareLinkOverrides.filter((l) => l.id !== linkId);
}

export function rotateMockShareLinkOverride(linkId: string): string | null {
  const index = mockShareLinkOverrides.findIndex((l) => l.id === linkId);
  if (index === -1) return null;
  const newToken = `mock-demo-share-${Date.now().toString(36)}`;
  mockShareLinkOverrides[index] = {
    ...mockShareLinkOverrides[index],
    token: newToken,
  };
  return newToken;
}

export function rotateMockShareLink(
  link: HubShareLink,
  createdBy: string,
): string | null {
  const fromOverride = rotateMockShareLinkOverride(link.id);
  if (fromOverride) return fromOverride;

  if (!mockShareLinkRevoked.has(link.id)) {
    revokeMockShareLink(link.id);
    const replacement = createMockShareLink({
      projectId: link.project_id,
      scopeType: link.scope_type,
      scopeId: link.scope_id,
      createdBy,
      label: link.config.label,
      showComments: link.config.showComments,
      assetIds: link.config.assetIds,
      expiresAt: link.expires_at,
    });
    return replacement.token;
  }

  return null;
}

export function getMockShareLinks(
  projectId: string,
  scopeType: ShareLinkScopeType,
  scopeId: string,
  createdBy: string,
): HubShareLink[] {
  if (!isMockProjectId(projectId)) return [];

  const base: HubShareLink[] = [];

  if (
    scopeType === "presentation" &&
    (scopeId === MOCK_INITIATIVE.id || scopeId === MOCK_BOARD.id)
  ) {
    base.push({
      id: `${MOCK_PREFIX}share-presentation`,
      project_id: projectId,
      created_by: createdBy,
      token: MOCK_SHARE_TOKEN_PRESENTATION,
      scope_type: "presentation",
      scope_id: MOCK_INITIATIVE.id,
      config: {
        label: "Client reel — round 2",
        assetIds: MOCK_ASSET_DEFS.map((a) => a.id),
      },
      expires_at: daysFromNow(23),
      revoked_at: null,
      view_count: 14,
      last_viewed_at: hoursAgo(2),
      created_at: daysAgo(2),
    });
  }

  if (scopeType === "asset" && scopeId === MOCK_ASSET.id) {
    base.push({
      id: `${MOCK_PREFIX}share-asset`,
      project_id: projectId,
      created_by: PREETI.id,
      token: MOCK_SHARE_TOKEN_ASSET,
      scope_type: "asset",
      scope_id: MOCK_ASSET.id,
      config: { label: "Poster v3 + feedback", showComments: true },
      expires_at: daysFromNow(6),
      revoked_at: null,
      view_count: 6,
      last_viewed_at: hoursAgo(5),
      created_at: daysAgo(4),
    });
  }

  const scopedOverrides = mockShareLinkOverrides.filter(
    (l) =>
      l.project_id === projectId &&
      l.scope_type === scopeType &&
      l.scope_id === scopeId &&
      !l.revoked_at,
  );

  return [...scopedOverrides, ...base.filter((l) => !mockShareLinkRevoked.has(l.id))];
}

export function createMockShareLink(input: {
  projectId: string;
  scopeType: ShareLinkScopeType;
  scopeId: string;
  createdBy: string;
  label?: string;
  showComments?: boolean;
  assetIds?: string[];
  expiresAt?: string | null;
}): HubShareLink {
  const token = `mock-demo-share-${Date.now().toString(36)}`;
  const link: HubShareLink = {
    id: `${MOCK_PREFIX}share-${token.slice(-8)}`,
    project_id: input.projectId,
    created_by: input.createdBy,
    token,
    scope_type: input.scopeType,
    scope_id: input.scopeId,
    config: {
      label: input.label,
      showComments: input.showComments,
      assetIds: input.assetIds,
    },
    expires_at: input.expiresAt ?? null,
    revoked_at: null,
    view_count: 0,
    last_viewed_at: null,
    created_at: new Date().toISOString(),
  };
  addMockShareLinkOverride(link);
  return link;
}

export function resolveMockShareToken(token: string): ResolvedShare | null {
  if (!isMockShareDemoEnabled() || !isMockShareToken(token)) return null;

  if (token === MOCK_SHARE_TOKEN_PRESENTATION && mockShareLinkRevoked.has(`${MOCK_PREFIX}share-presentation`)) {
    return null;
  }

  if (token === MOCK_SHARE_TOKEN_PRESENTATION) {
    const assets = getMockWorkspaceAssets()
      .filter((a) => a.status === "approved" || a.status === "final")
      .map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        public_url: a.public_url,
        tag: a.tag,
        status: a.status,
        sort_order: a.sort_order,
      }));

    return {
      ok: true,
      link_id: `${MOCK_PREFIX}share-presentation`,
      scope_type: "presentation",
      config: { label: "Client reel — round 2" },
      project_name: MOCK_PROJECT.name,
      initiative_name: MOCK_INITIATIVE.name,
      shared_by: "Preeti",
      assets,
      comments: [],
    };
  }

  if (token === MOCK_SHARE_TOKEN_ASSET && mockShareLinkRevoked.has(`${MOCK_PREFIX}share-asset`)) {
    return null;
  }

  if (token === MOCK_SHARE_TOKEN_ASSET) {
    const asset = getMockWorkspaceAssets().find((a) => a.id === MOCK_ASSET.id);
    if (!asset) return null;

    return {
      ok: true,
      link_id: `${MOCK_PREFIX}share-asset`,
      scope_type: "asset",
      config: { label: "Poster v3 + feedback", showComments: true },
      project_name: MOCK_PROJECT.name,
      initiative_name: MOCK_INITIATIVE.name,
      shared_by: "Preeti",
      assets: [
        {
          id: asset.id,
          name: asset.name,
          type: asset.type,
          public_url: asset.public_url,
          tag: asset.tag,
          status: asset.status,
          sort_order: asset.sort_order,
        },
      ],
      comments: [
        {
          id: `${MOCK_PREFIX}share-comment-1`,
          body: "Logo feels a touch small next to the headline — otherwise love it.",
          created_at: hoursAgo(6),
          author_name: "Preeti",
          resolved: false,
        },
        {
          id: `${MOCK_PREFIX}share-comment-2`,
          body: "Can we try the cream background from round 1?",
          created_at: hoursAgo(4),
          author_name: "Alex (Design)",
          resolved: false,
        },
      ],
    };
  }

  const override = mockShareLinkOverrides.find((l) => l.token === token && !l.revoked_at);
  if (!override) return null;

  if (override.scope_type === "asset") {
    const asset = getMockWorkspaceAssets().find((a) => a.id === override.scope_id);
    if (!asset) return { ok: false, reason: "invalid" };

    return {
      ok: true,
      link_id: override.id,
      scope_type: "asset",
      config: override.config,
      project_name: MOCK_PROJECT.name,
      initiative_name: MOCK_INITIATIVE.name,
      shared_by: "You",
      assets: [
        {
          id: asset.id,
          name: asset.name,
          type: asset.type,
          public_url: asset.public_url,
          tag: asset.tag,
          status: asset.status,
          sort_order: asset.sort_order,
        },
      ],
      comments: override.config.showComments
        ? [
            {
              id: `${MOCK_PREFIX}share-comment-1`,
              body: "Logo feels a touch small next to the headline — otherwise love it.",
              created_at: hoursAgo(6),
              author_name: "Preeti",
              resolved: false,
            },
          ]
        : [],
    };
  }

  const assets = getMockWorkspaceAssets()
    .filter((a) => a.status === "approved" || a.status === "final")
    .map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      public_url: a.public_url,
      tag: a.tag,
      status: a.status,
      sort_order: a.sort_order,
    }));

  return {
    ok: true,
    link_id: override.id,
    scope_type: "presentation",
    config: override.config,
    project_name: MOCK_PROJECT.name,
    initiative_name: MOCK_INITIATIVE.name,
    shared_by: "You",
    assets,
    comments: [],
  };
}

export function getMockSharePreviewPaths() {
  return [
    { label: "Client reel", path: `/share/${MOCK_SHARE_TOKEN_PRESENTATION}` },
    { label: "Single asset + comments", path: `/share/${MOCK_SHARE_TOKEN_ASSET}` },
  ] as const;
}
