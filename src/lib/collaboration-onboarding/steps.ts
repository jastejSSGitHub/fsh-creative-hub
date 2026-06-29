import type {
  CollaborationOnboardingFeatureId,
  CollaborationOnboardingFlow,
} from "@/lib/collaboration-onboarding/types";

export type { CollaborationOnboardingFeatureId };

export const COLLABORATION_ONBOARDING_FLOWS: Partial<
  Record<CollaborationOnboardingFeatureId, CollaborationOnboardingFlow>
> = {
  "needs-you-feed": {
    featureId: "needs-you-feed",
    steps: [
      {
        title: "Everything that needs you, in one feed",
        body: "Mentions, assigned tasks, overdue work, and votes — sorted by what blocks progress first.",
        cta: "Show me",
        illustration: "needs-you-feed",
      },
      {
        title: "Personal tasks stay personal",
        body: "Inbox tasks only appear for you and whoever you assign. Project work is visible to the team.",
        cta: "Got it",
        illustration: "privacy-feed",
      },
    ],
  },
  "global-quick-add": {
    featureId: "global-quick-add",
    steps: [
      {
        title: "Add a task from anywhere",
        body: "Press Q or tap + — same quick add from Tasks. Use #Project, +name, @label, and dates inline.",
        cta: "Try it",
        illustration: "global-quick-add",
      },
    ],
  },
  "task-deep-link": {
    featureId: "task-deep-link",
    steps: [
      {
        title: "Share a direct link to any task",
        body: "Open a task and copy the URL — teammates land on the same task overlay in the board or list.",
        cta: "Got it",
        illustration: "task-deep-link",
      },
    ],
  },
  "task-visibility": {
    featureId: "task-visibility",
    steps: [
      {
        title: "Know who can see each task",
        body: "Personal — just you (and assignee). Project — your team. Team — org-wide.",
        cta: "Next",
        illustration: "visibility-badge",
      },
      {
        title: "Assigning shares the task",
        body: "When you assign a personal task, that person gets access. You'll see a confirmation.",
        cta: "Got it",
        illustration: "assign-confirm",
      },
    ],
  },
  "promote-task": {
    featureId: "promote-task",
    steps: [
      {
        title: "Move personal work into a project",
        body: "Promote an inbox task to share it with the project team — great when solo notes become team work.",
        cta: "Got it",
        illustration: "promote-task",
      },
    ],
  },
  "task-asset-link": {
    featureId: "task-asset-link",
    steps: [
      {
        title: "Tasks stay tied to the file",
        body: "Link assets to tasks so everyone sees which poster, deck, or cut the work belongs to.",
        cta: "Next",
        illustration: "task-asset-strip",
      },
      {
        title: "Jump both ways",
        body: "Open tasks from the asset sidebar, or preview the file while updating the task.",
        cta: "Got it",
        illustration: "asset-tasks",
      },
    ],
  },
  "comment-to-task": {
    featureId: "comment-to-task",
    steps: [
      {
        title: "Turn feedback into a task",
        body: "On any comment, choose Create task — we pre-fill the description and link the asset.",
        cta: "Got it",
        illustration: "comment-to-task",
      },
    ],
  },
  "for-you-inline-reply": {
    featureId: "for-you-inline-reply",
    steps: [
      {
        title: "Reply without leaving For You",
        body: "Hit Reply on any item to respond inline. Optionally create a follow-up task in the same step.",
        cta: "Got it",
        illustration: "inline-reply",
      },
    ],
  },
  "for-you-lenses": {
    featureId: "for-you-lenses",
    steps: [
      {
        title: "Switch lenses, not tabs",
        body: "Needs you — your action queue. Waiting on others — what you're blocked on. Following — threads you care about.",
        cta: "Next",
        illustration: "lenses-tab",
      },
      {
        title: "Your uploads, separate",
        body: "Your uploads collects feedback on files you own — easy to scan without the noise.",
        cta: "Got it",
        illustration: "generic",
      },
    ],
  },
  "task-watch": {
    featureId: "task-watch",
    steps: [
      {
        title: "Following happens automatically",
        body: "Comment on a task or thread and it appears in your Following lens — no manual subscribe needed.",
        cta: "Got it",
        illustration: "task-watch",
      },
    ],
  },
  "thread-resolve-loop": {
    featureId: "thread-resolve-loop",
    steps: [
      {
        title: "Close the loop on feedback",
        body: "When you complete a task linked to a comment, we'll suggest resolving the original thread.",
        cta: "Got it",
        illustration: "resolve-loop",
      },
    ],
  },
  "presence": {
    featureId: "presence",
    steps: [
      {
        title: "See who's in the project",
        body: "Avatar stacks show teammates viewing the same project or task — lightweight, no chat noise.",
        cta: "Got it",
        illustration: "presence",
      },
    ],
  },
  "smart-capture": {
    featureId: "smart-capture",
    steps: [
      {
        title: "Quick add knows where you are",
        body: "From an asset, For You item, or comment — Q pre-fills project, file link, and context.",
        cta: "Got it",
        illustration: "smart-capture",
      },
    ],
  },
  "for-you-triage": {
    featureId: "for-you-triage",
    steps: [
      {
        title: "Triage on your terms",
        body: "Snooze brings items back later today, tomorrow, or next week. Handled clears them without closing threads.",
        cta: "Got it",
        illustration: "for-you-triage",
      },
    ],
  },
  "split-pane-task-asset": {
    featureId: "split-pane-task-asset",
    steps: [
      {
        title: "Work on the task with the file visible",
        body: "On desktop, linked assets open beside the task — preview the creative while you update details.",
        cta: "Got it",
        illustration: "split-pane",
      },
    ],
  },
  "creative-board": {
    featureId: "creative-board",
    steps: [
      {
        title: "A board built for creative work",
        body: "New projects get Not started → In progress → In review → Waiting on client → Done columns.",
        cta: "Got it",
        illustration: "creative-board",
      },
    ],
  },
};
