export type CollaborationOnboardingFeatureId =
  | "needs-you-feed"
  | "global-quick-add"
  | "task-deep-link"
  | "task-visibility"
  | "promote-task"
  | "task-asset-link"
  | "comment-to-task"
  | "for-you-inline-reply"
  | "for-you-lenses"
  | "task-watch"
  | "thread-resolve-loop"
  | "presence"
  | "smart-capture"
  | "for-you-triage"
  | "split-pane-task-asset"
  | "creative-board";

export type CollaborationOnboardingIllustration =
  | "needs-you-feed"
  | "privacy-feed"
  | "global-quick-add"
  | "task-deep-link"
  | "visibility-badge"
  | "assign-confirm"
  | "promote-task"
  | "asset-tasks"
  | "task-asset-strip"
  | "comment-to-task"
  | "inline-reply"
  | "lenses-tab"
  | "task-watch"
  | "resolve-loop"
  | "presence"
  | "smart-capture"
  | "for-you-triage"
  | "split-pane"
  | "creative-board"
  | "generic";

export type CollaborationOnboardingStep = {
  title: string;
  body: string;
  cta: string;
  illustration: CollaborationOnboardingIllustration;
};

export type CollaborationOnboardingFlow = {
  featureId: CollaborationOnboardingFeatureId;
  steps: CollaborationOnboardingStep[];
};
