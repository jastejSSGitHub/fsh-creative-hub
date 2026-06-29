import type { TaskWithMeta } from "@/lib/tasks/types";
import type { AssetWithVotes } from "@/lib/workspace/queries";
import type { ProjectCardData } from "@/lib/projects/queries";

const now = "2026-06-29T12:00:00.000Z";

export function createPersonalTask(overrides: Partial<TaskWithMeta> = {}): TaskWithMeta {
  return {
    id: "task-personal-1",
    name: "Review homepage copy",
    description: null,
    project_id: null,
    section_id: null,
    parent_id: null,
    created_by: "user-a",
    assignee_id: null,
    priority: 4,
    due_at: null,
    recurring_rule: null,
    completed: false,
    completed_at: null,
    sort_order: 0,
    created_at: now,
    labels: [],
    assignee: null,
    project: null,
    ...overrides,
  };
}

export function createProjectTask(overrides: Partial<TaskWithMeta> = {}): TaskWithMeta {
  return createPersonalTask({
    id: "task-project-1",
    project_id: "project-1",
    project: { id: "project-1", name: "Spring Campaign" },
    ...overrides,
  });
}

export function createTestAsset(overrides: Partial<AssetWithVotes> = {}): AssetWithVotes {
  return {
    id: "asset-1",
    initiative_id: "initiative-1",
    name: "Hero banner v2",
    type: "image",
    storage_path: "test/hero.jpg",
    public_url: "https://example.com/hero.jpg",
    tag: "v1",
    status: "pending",
    uploaded_by: "user-a",
    sort_order: 0,
    variant_of: null,
    is_fix_candidate: false,
    legacy_approved_by: null,
    created_at: now,
    votes: [],
    consensus: { fire: 0, up: 0, hmm: 0, no: 0 },
    versionCount: 1,
    ...overrides,
  };
}

export function createTestProject(overrides: Partial<ProjectCardData> = {}): ProjectCardData {
  return {
    id: "project-1",
    name: "Spring Campaign",
    description: null,
    cover_url: null,
    created_at: now,
    updated_at: now,
    trashed_at: null,
    assetCount: 2,
    lastActivityAt: null,
    lastActivitySummary: null,
    isFavorite: false,
    favoritedAt: null,
    role: "admin",
    members: [
      {
        id: "user-a",
        display_name: "User A",
        avatar_url: null,
        role: "admin",
      },
      {
        id: "user-b",
        display_name: "User B",
        avatar_url: null,
        role: "editor",
      },
    ],
    ...overrides,
  };
}
