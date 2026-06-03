import { describe, it, expect, vi, afterEach } from "vitest";
import { shuffle, buildQueue, formatTime } from "@/utils/quiz";
import type { Entry } from "@/types/data";

function entries(...chars: string[]): Entry[] {
  return chars.map((c) => ({ character: c, latin: c }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("shuffle", () => {
  it("returns a new array, leaving the input untouched", () => {
    const input = entries("a", "b", "c");
    const result = shuffle(input);
    expect(result).not.toBe(input);
    expect(input.map((e) => e.character)).toEqual(["a", "b", "c"]);
  });

  it("preserves all elements (a permutation)", () => {
    const input = entries("a", "b", "c", "d", "e");
    const result = shuffle(input);
    expect(result).toHaveLength(input.length);
    expect(result.map((e) => e.character).sort()).toEqual(
      input.map((e) => e.character).sort(),
    );
  });

  it("handles empty and single-element arrays", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle([1])).toEqual([1]);
  });

  it("produces a deterministic order for a fixed Math.random", () => {
    // Math.random always returns 0 -> j is always 0 in the Fisher-Yates loop.
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(shuffle([1, 2, 3, 4])).toEqual([2, 3, 4, 1]);
  });
});

describe("buildQueue", () => {
  it("returns exactly `count` entries when count <= pool size", () => {
    const pool = entries("a", "b", "c", "d", "e");
    expect(buildQueue(pool, 3)).toHaveLength(3);
  });

  it("returns exactly `count` entries when count > pool size (reshuffles)", () => {
    const pool = entries("a", "b", "c");
    expect(buildQueue(pool, 10)).toHaveLength(10);
  });

  it("returns an empty queue for count 0", () => {
    expect(buildQueue(entries("a", "b"), 0)).toEqual([]);
  });

  it("draws only from the provided entries", () => {
    const pool = entries("a", "b", "c");
    const valid = new Set(["a", "b", "c"]);
    for (const e of buildQueue(pool, 12)) {
      expect(valid.has(e.character)).toBe(true);
    }
  });

  it("uses each entry once before repeating within a full pool cycle", () => {
    const pool = entries("a", "b", "c", "d");
    const result = buildQueue(pool, 4);
    expect(new Set(result.map((e) => e.character)).size).toBe(4);
  });

  it("avoids an immediate repeat across a reshuffle boundary", () => {
    // With a 2-entry pool, every reshuffle boundary is a repeat risk.
    // random=0 makes shuffle deterministic and forces the swap branch,
    // exercising the no-immediate-repeat guard.
    vi.spyOn(Math, "random").mockReturnValue(0);
    const pool = entries("a", "b");
    const result = buildQueue(pool, 6);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].character).not.toBe(result[i - 1].character);
    }
  });
});

describe("formatTime", () => {
  it("formats sub-minute durations with zero-padded minutes", () => {
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(5)).toBe("00:05");
    expect(formatTime(59)).toBe("00:59");
  });

  it("rolls over into minutes", () => {
    expect(formatTime(60)).toBe("01:00");
    expect(formatTime(75)).toBe("01:15");
    expect(formatTime(600)).toBe("10:00");
  });

  it("handles durations beyond 99 minutes", () => {
    expect(formatTime(6000)).toBe("100:00");
  });
});
