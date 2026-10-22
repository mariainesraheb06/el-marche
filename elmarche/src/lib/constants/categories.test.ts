import { describe, expect, it } from "vitest";
import { CATEGORIES } from "./categories";

describe("CATEGORIES", () => {
  it("contains the 10 MVP categories with unique slugs", () => {
    expect(CATEGORIES).toHaveLength(10);
    expect(new Set(CATEGORIES.map((c) => c.slug)).size).toBe(10);
  });
});