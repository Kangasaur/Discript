import { describe, it, expect } from "vitest";
import { clamp, MIN_COUNT, MAX_COUNT } from "@/utils/quizOptions";

describe("clamp", () => {
  it("leaves in-range values unchanged", () => {
    expect(clamp(20)).toBe(20);
    expect(clamp(MIN_COUNT)).toBe(MIN_COUNT);
    expect(clamp(MAX_COUNT)).toBe(MAX_COUNT);
  });

  it("clamps values below the minimum", () => {
    expect(clamp(0)).toBe(MIN_COUNT);
    expect(clamp(-50)).toBe(MIN_COUNT);
  });

  it("clamps values above the maximum", () => {
    expect(clamp(MAX_COUNT + 1)).toBe(MAX_COUNT);
    expect(clamp(100000)).toBe(MAX_COUNT);
  });
});
