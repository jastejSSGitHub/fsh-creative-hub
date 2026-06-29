import { describe, expect, it } from "vitest";

import {
  isMissingIntelligenceSchemaError,
  toIntelligenceErrorMessage,
} from "@/lib/intelligence/errors";

describe("intelligence errors", () => {
  it("detects missing schema errors", () => {
    expect(
      isMissingIntelligenceSchemaError({
        message: "Could not find the table 'public.hub_project_briefs' in the schema cache",
      }),
    ).toBe(true);
  });

  it("maps missing schema to setup message", () => {
    expect(
      toIntelligenceErrorMessage({
        message: "relation \"hub_content_index\" does not exist",
      }),
    ).toContain("migration 023");
  });
});
