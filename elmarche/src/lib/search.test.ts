import { describe, expect, it } from "vitest";
import { toTsQuery } from "./search";

describe("toTsQuery", () => {
  it("matches word beginnings and joins words with AND", () => {
    expect(toTsQuery("Baggy jogger")).toBe("baggy:* & jogger:*");
  });

  it("ignores accents and case", () => {
    expect(toTsQuery("Électronique")).toBe("electronique:*");
  });

  it("strips characters that could break the query", () => {
    expect(toTsQuery("jogger & (noir) | !")).toBe("jogger:* & noir:*");
  });

  it("returns null when there is nothing to search", () => {
    expect(toTsQuery("  !!!  ")).toBeNull();
  });
});