import { describe, expect, it } from "vitest";

import {
  filterIntelligenceProjectOptions,
  paginateIntelligenceProjectOptions,
  type IntelligenceProjectOption,
} from "@/lib/intelligence/project-options";

const sample: IntelligenceProjectOption[] = [
  {
    id: "1",
    name: "Alpha",
    description: "First",
    cover_url: null,
    role: "admin",
  },
  {
    id: "2",
    name: "Beta Campaign",
    description: null,
    cover_url: "/media/projects_thumbnails/blenz_thumbnail.png",
    role: "editor",
  },
  {
    id: "3",
    name: "Gamma",
    description: "Third",
    cover_url: null,
    role: "viewer",
  },
];

describe("project-options", () => {
  it("filters by name and description", () => {
    expect(filterIntelligenceProjectOptions(sample, "campaign")).toHaveLength(1);
    expect(filterIntelligenceProjectOptions(sample, "third")).toHaveLength(1);
  });

  it("paginates client-side", () => {
    const page1 = paginateIntelligenceProjectOptions(sample, 1, 2);
    expect(page1.items).toHaveLength(2);
    expect(page1.totalPages).toBe(2);

    const page2 = paginateIntelligenceProjectOptions(sample, 2, 2);
    expect(page2.items).toHaveLength(1);
  });
});
