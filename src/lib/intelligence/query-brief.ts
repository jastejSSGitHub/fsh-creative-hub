import type {
  IntelligenceTemplateId,
  IntelligenceView,
  ProjectBrief,
} from "@/lib/intelligence/types";

function formatReviewSummary(brief: ProjectBrief): string {
  const { reviewSummary } = brief.sections;
  if (reviewSummary.total === 0) {
    return "No review assets uploaded yet.";
  }

  return `${reviewSummary.total} assets — ${reviewSummary.approved} approved, ${reviewSummary.rejected} rejected, ${reviewSummary.pending} pending.`;
}

export function buildIntelligenceView(
  brief: ProjectBrief,
  templateId: IntelligenceTemplateId,
): IntelligenceView {
  switch (templateId) {
    case "collaterals":
      return {
        templateId,
        title: "Collaterals & content",
        summary: `${brief.sections.collaterals.length} collateral items and ${brief.sections.documents.length} document excerpts across ${brief.stats.fileCount} files.`,
        items: [
          ...brief.sections.collaterals,
          ...brief.sections.documents,
          ...brief.sections.urls,
        ],
        labels: brief.sections.labels,
      };

    case "review":
      return {
        templateId,
        title: "Review progress",
        summary: formatReviewSummary(brief),
        items: brief.sections.collaterals.filter((item) => item.kind === "asset"),
        reviewSummary: brief.sections.reviewSummary,
        labels: brief.sections.labels,
      };

    case "blocking": {
      const rejectedAssets = brief.sections.collaterals.filter(
        (item) => item.kind === "asset" && item.meta?.status === "rejected",
      );
      const highlights = [
        ...brief.sections.tasks.highlights,
        ...rejectedAssets,
      ];

      return {
        templateId,
        title: "What needs attention",
        summary:
          brief.sections.tasks.overdue > 0
            ? `${brief.sections.tasks.overdue} overdue tasks and ${rejectedAssets.length} rejected assets.`
            : rejectedAssets.length > 0
              ? `${rejectedAssets.length} rejected assets need follow-up.`
              : `${brief.sections.tasks.open} open tasks in this project.`,
        items: highlights,
        taskStats: {
          open: brief.sections.tasks.open,
          overdue: brief.sections.tasks.overdue,
        },
        labels: brief.sections.labels,
      };
    }

    case "full":
    default:
      return {
        templateId: "full",
        title: `${brief.projectName} — project brief`,
        summary: brief.headline,
        items: [
          ...brief.sections.workshops.slice(0, 6),
          ...brief.sections.collaterals.slice(0, 12),
          ...brief.sections.documents.slice(0, 8),
          ...brief.sections.tasks.highlights.slice(0, 6),
        ],
        reviewSummary: brief.sections.reviewSummary,
        taskStats: {
          open: brief.sections.tasks.open,
          overdue: brief.sections.tasks.overdue,
        },
        labels: brief.sections.labels,
      };
  }
}
