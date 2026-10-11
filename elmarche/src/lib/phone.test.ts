import { describe, expect, it } from "vitest";
import { normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("converts local mobile numbers", () => {
    expect(normalizePhone("0551234567")).toBe("+213551234567");
    expect(normalizePhone("0551 23 45 67")).toBe("+213551234567");
  });

  it("accepts international formats", () => {
    expect(normalizePhone("+213 551 23 45 67")).toBe("+213551234567");
    expect(normalizePhone("00213551234567")).toBe("+213551234567");
    expect(normalizePhone("+33612345678")).toBe("+33612345678");
  });

  it("removes a mistaken zero after the country code", () => {
    expect(normalizePhone("+2130551234567")).toBe("+213551234567");
  });

  it("rejects landlines and garbage", () => {
    expect(normalizePhone("0212345678")).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
    expect(normalizePhone("")).toBeNull();
  });
});