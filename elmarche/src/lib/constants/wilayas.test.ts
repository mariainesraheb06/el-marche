import { describe, expect, it } from "vitest";
import { WILAYAS, isValidWilayaCode, wilayaName } from "./wilayas";

describe("WILAYAS", () => {
  it("has unique codes", () => {
    expect(new Set(WILAYAS.map((w) => w.code)).size).toBe(WILAYAS.length);
  });

  it("looks codes up correctly", () => {
    expect(isValidWilayaCode(16)).toBe(true);
    expect(isValidWilayaCode(0)).toBe(false);
    expect(wilayaName(31)).toBe("Oran");
  });
});