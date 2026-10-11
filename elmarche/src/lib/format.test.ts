import { describe, expect, it } from "vitest";
import { formatPrice, whatsappLink } from "./format";

describe("formatPrice", () => {
  it("formats amounts as designed: 4,500 DA", () => {
    expect(formatPrice(4500)).toBe("4,500 DA");
    expect(formatPrice(800)).toBe("800 DA");
  });
});

describe("whatsappLink", () => {
  it("accepts international numbers", () => {
    expect(whatsappLink("+213551234567", "Jogger")).toMatch(
      /^https:\/\/wa\.me\/213551234567\?text=/,
    );
  });

  it("converts local numbers starting with 0", () => {
    expect(whatsappLink("0551234567", "Jogger")).toMatch(/^https:\/\/wa\.me\/213551234567\?/);
  });

  it("returns null for invalid numbers", () => {
    expect(whatsappLink("abc", "Jogger")).toBeNull();
  });
});