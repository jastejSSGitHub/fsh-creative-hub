import type { SupabaseClient } from "@supabase/supabase-js";

import { sortForYouItems } from "@/lib/inbox/priority";
import type { HubComment, HubProfile } from "@/types/database";

export type ForYouItemKind =
  | "mention"
  | "upload_thread"
  | "task_mention"
  | "task_assigned"
  | "task_overdue"
  | "vote_requested"
  | "task_waiting"
  | "upload_stale"
  | "following"
  | "resolve_suggested";

type ProfilePick = Pick<HubProfile, "id" | "display_name" | "avatar_url">;

export type AssetForYouItem = {
  id: string;
  kind: "mention" | "upload_thread" | "upload_stale" | "following";
  sort_at: string;
  comment: HubComment & { author: ProfilePick };
  asset: {
    id: string;
    name: string;
    initiative_id: string;
    public_url?: string | null;
  };
  initiative: {
    id: string;
    name: string;
    project_id: string;
  };
  project: {
    id: string;
    name: string;
  };
};

export type TaskMentionForYouItem = {
  id: string;
  kind: "task_mention" | "following";
  sort_at: string;
  comment: {
    id: string;
    body: string;
    created_at: string;
    parent_id?: string | null;
    author: ProfilePick;
  };
  task: {
    id: string;
    name: string;
    project_id: string | null;
  };
  project: { id: string; name: string } | null;
};

export type TaskAssignedForYouItem = {
  id: string;
  kind: "task_assigned" | "task_overdue" | "task_waiting";
  sort_at: string;
  task: {
    id: string;
    name: string;
    project_id: string | null;
    due_at: string | null;
    created_at: string;
  };
  project: { id: string; name: string; is_org_wide?: boolean } | null;
  assigner: ProfilePick | null;
};

export type VoteRequestedForYouItem = {
  id: string;
  kind: "vote_requested";
  sort_at: string;
  asset: {
    id: string;
    name: string;
    public_url: string | null;
    initiative_id: string;
  };
  initiative: { id: string; name: string; project_id: string };
  project: { id: string; name: string };
};

export type ResolveSuggestedForYouItem = {
  id: string;
  kind: "resolve_suggested";
  sort_at: string;
  comment: {
    id: string;
    body: string;
    asset_id: string;
  };
  task: { id: string; name: string };
  asset: { id: string; name: string };
  project: { id: string; name: string };
  initiative: { id: string; name: string };
};

export type ForYouItem =
  | AssetForYouItem
  | TaskMentionForYouItem
  | TaskAssignedForYouItem
  | VoteRequestedForYouItem
  | ResolveSuggestedForYouItem;

type CommentRow = HubComment & {
  author: ProfilePick | ProfilePick[] | null;
  asset:
    | {
        id: string;
        name: string;
        initiative_id: string;
        uploaded_by: string;
        public_url?: string | null;
        initiative:
          | {
              id: string;
              name: string;
              project_id: string;
              project: { id: string; name: string } | { id: string; name: string }[];
            }
          | {
              id: string;
              name: string;
              project_id: string;
              project: { id: string; name: string } | { id: string; name: string }[];
            }[]
          | null;
      }
    | {
        id: string;
        name: string;
        initiative_id: string;
        uploaded_by: string;
        public_url?: string | null;
        initiative:
          | {
              id: string;
              name: string;
              project_id: string;
              project: { id: string; name: string } | { id: string; name: string }[];
            }
          | {
              id: string;
              name: string;
              project_id: string;
              project: { id: string; name: string } | { id: string; name: string }[];
            }[]
          | null;
      }[]
    | null;
};

const COMMENT_SELECT = `
  *,
  author:hub_profiles (
    id,
    display_name,
    avatar_url
  ),
  asset:hub_assets (
    id,
    name,
    initiative_id,
    uploaded_by,
    public_url,
    initiative:hub_initiatives (
      id,
      name,
      project_id,
      project:hub_projects (
        id,
        name
      )
    )
  )
`;

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function normalizeCommentRow(
  row: CommentRow,
  kind: "mention" | "upload_thread",
): AssetForYouItem | null {
  const asset = pickOne(row.asset);
  if (!asset) return null;

  const initiative = pickOne(asset.initiative);
  if (!initiative) return null;

  const project = pickOne(initiative.project);
  if (!project) return null;

  const author = pickOne(row.author);

  return {
    id: `${kind}:${row.id}`,
    kind,
    sort_at: row.created_at,
    comment: {
      id: row.id,
      asset_id: row.asset_id,
      parent_id: row.parent_id,
      author_id: row.author_id,
      body: row.body,
      mentions: row.mentions,
      resolved: row.resolved,
      created_at: row.created_at,
      linked_task_id: (row as HubComment & { linked_task_id?: string | null }).linked_task_id ?? null,
      author: author ?? {
        id: row.author_id,
        display_name: "Unknown",
        avatar_url: null,
      },
    },
    asset: {
      id: asset.id,
      name: asset.name,
      initiative_id: asset.initiative_id,
      public_url: asset.public_url ?? null,
    },
    initiative: {
      id: initiative.id,
      name: initiative.name,
      project_id: initiative.project_id,
    },
    project: {
      id: project.id,
      name: project.name,
    },
  };
}

export async function getForYouItems(
  supabase: SupabaseClient,
  userId: string,
): Promise<ForYouItem[]> {
  const now = new Date();
  const nowIso = now.toISOString();

  const [
    { data: mentionRows, error: mentionError },
    { data: myAssets },
    { data: taskMentionRows, error: taskMentionError },
    { data: assignedTasks, error: assignedError },
    { data: myVotes },
    { data: myMemberships },
    { data: followingComments },
    { data: delegatedTasks },
    { data: resolveCommentRows },
  ] = await Promise.all([
    supabase
      .from("hub_comments")
      .select(COMMENT_SELECT)
      .contains("mentions", [userId])
      .eq("resolved", false)
      .neq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase.from("hub_assets").select("id, created_at").eq("uploaded_by", userId),
    supabase
      .from("hub_task_comments")
      .select(
        `
        id,
        body,
        created_at,
        author_id,
        task_id,
        author:hub_profiles (id, display_name, avatar_url),
        task:hub_tasks (
          id,
          name,
          project_id,
          assignee_id,
          project:hub_projects (id, name)
        )
      `,
      )
      .contains("mentions", [userId])
      .neq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("hub_tasks")
      .select(
        `
        id,
        name,
        project_id,
        due_at,
        created_at,
        created_by,
        assignee:hub_profiles!hub_tasks_assignee_id_fkey (id, display_name, avatar_url),
        creator:hub_profiles!hub_tasks_created_by_fkey (id, display_name, avatar_url),
        project:hub_projects (id, name, is_org_wide)
      `,
      )
      .eq("assignee_id", userId)
      .eq("completed", false)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(40),
    supabase.from("hub_votes").select("asset_id").eq("user_id", userId),
    supabase.from("hub_project_members").select("project_id").eq("user_id", userId),
    supabase
      .from("hub_task_comments")
      .select(
        `
        id,
        body,
        created_at,
        author_id,
        task_id,
        author:hub_profiles (id, display_name, avatar_url),
        task:hub_tasks (
          id,
          name,
          project_id,
          assignee_id,
          completed,
          project:hub_projects (id, name)
        )
      `,
      )
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("hub_tasks")
      .select(
        `
        id,
        name,
        project_id,
        due_at,
        created_at,
        assignee:hub_profiles!hub_tasks_assignee_id_fkey (id, display_name, avatar_url),
        project:hub_projects (id, name, is_org_wide)
      `,
      )
      .eq("created_by", userId)
      .neq("assignee_id", userId)
      .not("assignee_id", "is", null)
      .eq("completed", false)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("hub_comments")
      .select(
        `
        id,
        body,
        asset_id,
        created_at,
        linked_task_id,
        asset:hub_assets (
          id,
          name,
          initiative_id,
          initiative:hub_initiatives (
            id,
            name,
            project_id,
            project:hub_projects (id, name)
          )
        )
      `,
      )
      .not("linked_task_id", "is", null)
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (mentionError) throw mentionError;
  if (taskMentionError) throw taskMentionError;
  if (assignedError) throw assignedError;

  const myAssetIds = (myAssets ?? []).map((asset) => asset.id);
  let uploadRows: CommentRow[] = [];

  if (myAssetIds.length > 0) {
    const { data, error } = await supabase
      .from("hub_comments")
      .select(COMMENT_SELECT)
      .in("asset_id", myAssetIds)
      .is("parent_id", null)
      .eq("resolved", false)
      .neq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(40);

    if (error) throw error;
    uploadRows = (data ?? []) as CommentRow[];
  }

  const votedAssetIds = new Set((myVotes ?? []).map((v) => v.asset_id));
  const projectIds = (myMemberships ?? []).map((m) => m.project_id);

  let pendingVoteAssets: Array<{
    id: string;
    name: string;
    public_url: string | null;
    initiative_id: string;
    created_at: string;
    initiative: {
      id: string;
      name: string;
      project_id: string;
      project: { id: string; name: string } | { id: string; name: string }[];
    };
  }> = [];

  if (projectIds.length > 0) {
    const { data: initiatives } = await supabase
      .from("hub_initiatives")
      .select("id, name, project_id, project:hub_projects(id, name)")
      .in("project_id", projectIds);

    const initiativeIds = (initiatives ?? []).map((i) => i.id);
    if (initiativeIds.length > 0) {
      const { data: assets } = await supabase
        .from("hub_assets")
        .select(
          "id, name, public_url, initiative_id, created_at, initiative:hub_initiatives(id, name, project_id, project:hub_projects(id, name))",
        )
        .in("initiative_id", initiativeIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(30);

      for (const asset of assets ?? []) {
        if (votedAssetIds.has(asset.id)) continue;
        const initiative = pickOne(
          asset.initiative as
            | {
                id: string;
                name: string;
                project_id: string;
                project: { id: string; name: string } | { id: string; name: string }[];
              }
            | {
                id: string;
                name: string;
                project_id: string;
                project: { id: string; name: string } | { id: string; name: string }[];
              }[]
            | null,
        );
        if (!initiative) continue;
        pendingVoteAssets.push({
          id: asset.id,
          name: asset.name,
          public_url: asset.public_url,
          initiative_id: asset.initiative_id,
          created_at: asset.created_at,
          initiative,
        });
      }
    }
  }

  const items = new Map<string, ForYouItem>();

  for (const row of (mentionRows ?? []) as CommentRow[]) {
    const item = normalizeCommentRow(row, "mention");
    if (item) items.set(item.id, item);
  }

  for (const row of uploadRows) {
    if (items.has(`mention:${row.id}`)) continue;
    const item = normalizeCommentRow(row, "upload_thread");
    if (item) items.set(item.id, item);
  }

  for (const row of taskMentionRows ?? []) {
    const author = pickOne(row.author);
    const task = pickOne(row.task);
    if (!task) continue;
    const project = pickOne(task.project);

    const item: TaskMentionForYouItem = {
      id: `task_mention:${row.id}`,
      kind: "task_mention",
      sort_at: row.created_at,
      comment: {
        id: row.id,
        body: row.body,
        created_at: row.created_at,
        author: author ?? {
          id: row.author_id,
          display_name: "Unknown",
          avatar_url: null,
        },
      },
      task: {
        id: task.id,
        name: task.name,
        project_id: task.project_id,
      },
      project: project ?? null,
    };
    items.set(item.id, item);
  }

  for (const row of assignedTasks ?? []) {
    const project = pickOne(row.project);
    const creator = pickOne(row.creator);
    const isOverdue = row.due_at && new Date(row.due_at) < now;
    const kind = isOverdue ? "task_overdue" : "task_assigned";

    const item: TaskAssignedForYouItem = {
      id: `${kind}:${row.id}`,
      kind,
      sort_at: row.due_at ?? row.created_at,
      task: {
        id: row.id,
        name: row.name,
        project_id: row.project_id,
        due_at: row.due_at,
        created_at: row.created_at,
      },
      project: project
        ? { id: project.id, name: project.name, is_org_wide: project.is_org_wide }
        : null,
      assigner: creator,
    };
    items.set(item.id, item);
  }

  for (const asset of pendingVoteAssets) {
    const initiative = pickOne(asset.initiative);
    const project = initiative ? pickOne(initiative.project) : null;
    if (!initiative || !project) continue;

    const item: VoteRequestedForYouItem = {
      id: `vote:${asset.id}`,
      kind: "vote_requested",
      sort_at: asset.created_at,
      asset: {
        id: asset.id,
        name: asset.name,
        public_url: asset.public_url,
        initiative_id: asset.initiative_id,
      },
      initiative: {
        id: initiative.id,
        name: initiative.name,
        project_id: initiative.project_id,
      },
      project: { id: project.id, name: project.name },
    };
    items.set(item.id, item);
  }

  for (const row of delegatedTasks ?? []) {
    const project = pickOne(row.project);
    const assignee = pickOne(row.assignee);
    const item: TaskAssignedForYouItem = {
      id: `task_waiting:${row.id}`,
      kind: "task_waiting",
      sort_at: row.created_at,
      task: {
        id: row.id,
        name: row.name,
        project_id: row.project_id,
        due_at: row.due_at,
        created_at: row.created_at,
      },
      project: project
        ? { id: project.id, name: project.name, is_org_wide: project.is_org_wide }
        : null,
      assigner: assignee,
    };
    items.set(item.id, item);
  }

  const seenFollowingTasks = new Set<string>();
  for (const row of followingComments ?? []) {
    const task = pickOne(row.task);
    if (!task || task.completed) continue;
    if (task.assignee_id === userId) continue;
    if (seenFollowingTasks.has(task.id)) continue;
    seenFollowingTasks.add(task.id);

    const author = pickOne(row.author);
    const project = pickOne(task.project);
    const item: TaskMentionForYouItem = {
      id: `following:task:${task.id}`,
      kind: "following",
      sort_at: row.created_at,
      comment: {
        id: row.id,
        body: row.body,
        created_at: row.created_at,
        author: author ?? {
          id: row.author_id,
          display_name: "You",
          avatar_url: null,
        },
      },
      task: {
        id: task.id,
        name: task.name,
        project_id: task.project_id,
      },
      project: project ?? null,
    };
    items.set(item.id, item);
  }

  const linkedTaskIds = (resolveCommentRows ?? [])
    .map((r) => r.linked_task_id)
    .filter((id): id is string => Boolean(id));

  let completedLinkedTasks = new Map<string, { id: string; name: string; assignee_id: string | null; created_by: string }>();

  if (linkedTaskIds.length > 0) {
    const { data: linkedTasks } = await supabase
      .from("hub_tasks")
      .select("id, name, completed, assignee_id, created_by")
      .in("id", linkedTaskIds)
      .eq("completed", true);

    for (const t of linkedTasks ?? []) {
      completedLinkedTasks.set(t.id, t);
    }
  }

  for (const row of resolveCommentRows ?? []) {
    if (!row.linked_task_id) continue;
    const task = completedLinkedTasks.get(row.linked_task_id);
    const asset = pickOne(row.asset);
    if (!task || !asset) continue;
    if (task.assignee_id !== userId && task.created_by !== userId) continue;

    const initiative = pickOne(asset.initiative);
    const project = initiative ? pickOne(initiative.project) : null;
    if (!initiative || !project) continue;

    const item: ResolveSuggestedForYouItem = {
      id: `resolve:${row.id}`,
      kind: "resolve_suggested",
      sort_at: row.created_at,
      comment: {
        id: row.id,
        body: row.body,
        asset_id: row.asset_id,
      },
      task: { id: task.id, name: task.name },
      asset: { id: asset.id, name: asset.name },
      project: { id: project.id, name: project.name },
      initiative: { id: initiative.id, name: initiative.name },
    };
    items.set(item.id, item);
  }

  for (const asset of myAssets ?? []) {
    const uploadItem = [...items.values()].find(
      (i) =>
        (i.kind === "upload_thread" || i.kind === "mention") &&
        "asset" in i &&
        i.asset.id === asset.id,
    );
    if (
      uploadItem &&
      uploadItem.kind === "upload_thread" &&
      Date.now() - new Date(asset.created_at).getTime() > 48 * 60 * 60 * 1000
    ) {
      const stale: AssetForYouItem = {
        ...uploadItem,
        id: `upload_stale:${uploadItem.comment.id}`,
        kind: "upload_stale",
      };
      items.set(stale.id, stale);
    }
  }

  return sortForYouItems([...items.values()], now);
}

const COUNTABLE_FOR_YOU_KINDS = new Set([
  "mention",
  "task_mention",
  "task_assigned",
  "task_overdue",
  "vote_requested",
  "resolve_suggested",
]);

/** Lightweight badge count — parallel head-only queries instead of full inbox fetch. */
export async function getForYouCount(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const [
    { count: mentionCount },
    { count: taskMentionCount },
    { count: assignedCount },
    { count: resolveCount },
    { data: memberships },
    { data: myVotes },
  ] = await Promise.all([
    supabase
      .from("hub_comments")
      .select("*", { count: "exact", head: true })
      .contains("mentions", [userId])
      .eq("resolved", false)
      .neq("author_id", userId),
    supabase
      .from("hub_task_comments")
      .select("*", { count: "exact", head: true })
      .contains("mentions", [userId])
      .neq("author_id", userId),
    supabase
      .from("hub_tasks")
      .select("*", { count: "exact", head: true })
      .eq("assignee_id", userId)
      .eq("completed", false),
    supabase
      .from("hub_comments")
      .select("*", { count: "exact", head: true })
      .not("linked_task_id", "is", null)
      .eq("resolved", false),
    supabase.from("hub_project_members").select("project_id").eq("user_id", userId),
    supabase.from("hub_votes").select("asset_id").eq("user_id", userId),
  ]);

  let voteRequestedCount = 0;
  const projectIds = (memberships ?? []).map((row) => row.project_id);
  const votedAssetIds = new Set((myVotes ?? []).map((vote) => vote.asset_id));

  if (projectIds.length > 0) {
    const { data: initiatives } = await supabase
      .from("hub_initiatives")
      .select("id")
      .in("project_id", projectIds);

    const initiativeIds = (initiatives ?? []).map((row) => row.id);
    if (initiativeIds.length > 0) {
      const { data: pendingAssets } = await supabase
        .from("hub_assets")
        .select("id")
        .in("initiative_id", initiativeIds)
        .eq("status", "pending")
        .limit(30);

      voteRequestedCount = (pendingAssets ?? []).filter(
        (asset) => !votedAssetIds.has(asset.id),
      ).length;
    }
  }

  return (
    (mentionCount ?? 0) +
    (taskMentionCount ?? 0) +
    (assignedCount ?? 0) +
    (resolveCount ?? 0) +
    voteRequestedCount
  );
}

/** Exact count from hydrated items — use when items are already loaded. */
export function countActionableForYouItems(items: ForYouItem[]): number {
  return items.filter((item) => COUNTABLE_FOR_YOU_KINDS.has(item.kind)).length;
}
