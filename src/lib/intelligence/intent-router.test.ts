import { describe, expect, it } from "vitest";

import {
  isIntelligenceIntent,
  resolveIntelligenceTemplate,
  stripIntelligencePrefix,
} from "@/lib/intelligence/intent-router";
import { buildIntelligenceView } from "@/lib/intelligence/query-brief";
import type { ProjectBrief } from "@/lib/intelligence/types";
import { PROJECT_BRIEF_VERSION } from "@/lib/intelligence/types";

const sampleBrief: ProjectBrief = {
  version: PROJECT_BRIEF_VERSION,
  projectId: "project-1",
  projectName: "Summer Campaign",
  generatedAt: new Date().toISOString(),
  headline: "2 files, 3 assets, 1 open tasks.",
  sections: {
    collaterals: [
      {
        id: "asset:1",
        kind: "asset",
        label: "Hero poster",
        href: "/projects/project-1/i/init-1/a/1",
        meta: { status: "approved" },
      },
      {
        id: "asset:2",
        kind: "asset",
        label: "Rejected banner",
        href: "/projects/project-1/i/init-1/a/2",
        meta: { status: "rejected" },
      },
    ],
    workshops: [
      {
        id: "canvas-sticky:1",
        kind: "canvas_node",
        label: "How might we improve checkout?",
        href: "/projects/project-1/canvas/c1?node=1",
      },
    ],
    documents: [
      {
        id: "doc-block:1",
        kind: "doc_block",
        label: "Creative brief",
        href: "/projects/project-1/docs/d1?block=1",
      },
    ],
    reviewSummary: {
      total: 3,
      approved: 1,
      rejected: 1,
      pending: 1,
      final: 0,
      byInitiative: [],
      recentCommentCount: 2,
    },
    tasks: {
      open: 1,
      overdue: 1,
      highlights: [
        {
          id: "task:1",
          kind: "task",
          label: "Fix headline",
          href: "/projects/project-1/tasks?task=1",
          meta: { overdue: 1 },
        },
      ],
    },
    labels: ["design", "marketing"],
    urls: [
      {
        id: "url:1",
        kind: "url",
        label: "https://example.com/brief",
        href: "https://example.com/brief",
        openInNewTab: true,
      },
    ],
  },
  stats: {
    fileCount: 2,
    assetCount: 3,
    canvasNodeCount: 4,
    openTaskCount: 1,
  },
};

describe("intent-router", () => {
  it("detects intelligence intents", () => {
    expect(isIntelligenceIntent("? summarize this project")).toBe(true);
    expect(isIntelligenceIntent("summarize review progress")).toBe(true);
    expect(isIntelligenceIntent("logo")).toBe(false);
  });

  it("strips ask prefixes", () => {
    expect(stripIntelligencePrefix("? what collaterals")).toBe("what collaterals");
    expect(stripIntelligencePrefix("ask show me tasks")).toBe("show me tasks");
  });

  it("routes templates from keywords", () => {
    expect(resolveIntelligenceTemplate("what collaterals do we have?")).toBe(
      "collaterals",
    );
    expect(resolveIntelligenceTemplate("review status")).toBe("review");
    expect(resolveIntelligenceTemplate("what is blocking us")).toBe("blocking");
  });
});

describe("query-brief", () => {
  it("builds collateral view", () => {
    const view = buildIntelligenceView(sampleBrief, "collaterals");
    expect(view.templateId).toBe("collaterals");
    expect(view.items.length).toBeGreaterThan(1);
  });

  it("builds blocking view with overdue tasks and rejected assets", () => {
    const view = buildIntelligenceView(sampleBrief, "blocking");
    expect(view.items.some((item) => item.kind === "task")).toBe(true);
    expect(view.items.some((item) => item.meta?.status === "rejected")).toBe(
      true,
    );
  });
});
