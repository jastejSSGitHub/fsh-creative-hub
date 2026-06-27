export const PROJECT_TEMPLATE_IDS = [
  "idea-sprint",
  "mood-board",
  "concept-map",
  "asset-review",
  "campaign-checklist",
  "client-signoff",
] as const;

export type ProjectTemplateId = (typeof PROJECT_TEMPLATE_IDS)[number];

export type ProjectTemplateFileType = "canvas" | "review_board";

export type ProjectTemplateDefinition = {
  id: ProjectTemplateId;
  title: string;
  fileType: ProjectTemplateFileType;
};

export const PROJECT_TEMPLATES: Record<
  ProjectTemplateId,
  ProjectTemplateDefinition
> = {
  "idea-sprint": {
    id: "idea-sprint",
    title: "Idea sprint",
    fileType: "canvas",
  },
  "mood-board": {
    id: "mood-board",
    title: "Mood board",
    fileType: "canvas",
  },
  "concept-map": {
    id: "concept-map",
    title: "Concept map",
    fileType: "canvas",
  },
  "asset-review": {
    id: "asset-review",
    title: "Asset review",
    fileType: "review_board",
  },
  "campaign-checklist": {
    id: "campaign-checklist",
    title: "Campaign checklist",
    fileType: "review_board",
  },
  "client-signoff": {
    id: "client-signoff",
    title: "Client sign-off",
    fileType: "review_board",
  },
};

export type PendingProjectTemplate = {
  id: ProjectTemplateId;
  title: string;
};

/** Canvas templates that apply real content inside an open canvas workspace. */
export const SHIPPED_CANVAS_WORKSPACE_TEMPLATE_IDS = new Set(["how-might-we"]);

export function getProjectTemplate(
  id: ProjectTemplateId,
): ProjectTemplateDefinition {
  return PROJECT_TEMPLATES[id];
}

export function isProjectBannerTemplate(id: ProjectTemplateId): boolean {
  return id in PROJECT_TEMPLATES;
}

/** Banner templates on the project page — creation works; full template experience is not shipped yet. */
export function shouldShowProjectTemplateComingSoon(
  id: ProjectTemplateId,
): boolean {
  return isProjectBannerTemplate(id);
}
