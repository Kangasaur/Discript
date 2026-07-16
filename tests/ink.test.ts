import { describe, expect, it } from "vitest";
import { inkBounds, normalizeStrokes, serializeStrokes, toPointDeltaSequence } from "@/utils/ink";
import type { InkStroke } from "@/types/handwriting";

const strokes: InkStroke[] = [
  [
    { x: 0, y: 0, t: 0 },
    { x: 10, y: 0, t: 16 },
  ],
  [
    { x: 0, y: 10, t: 100 },
    { x: 10, y: 10, t: 116 },
  ],
];

describe("ink", () => {
  it("computes the ink bounding box", () => {
    expect(inkBounds(strokes)).toMatchObject({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
  });

  it("normalizes the bbox height to 1 and centres the ink", () => {
    const normalized = normalizeStrokes(strokes);
    expect(normalized.scale).toBeCloseTo(0.1);
    expect(normalized.strokes[0][0]).toMatchObject({ x: -0.5, y: -0.5 });
    expect(normalized.strokes[1][1]).toMatchObject({ x: 0.5, y: 0.5 });
  });

  it("emits [dx, dy, dt, pen_up] per point with pen-up at stroke ends", () => {
    expect(toPointDeltaSequence(strokes)).toEqual([
      [0, 0, 0, 0],
      [10, 0, 16, 1],
      [-10, 10, 84, 0],
      [10, 0, 16, 1],
    ]);
  });

  it("serializes strokes as [x, y, t] triplets", () => {
    expect(serializeStrokes(strokes)[0]).toEqual([
      [0, 0, 0],
      [10, 0, 16],
    ]);
  });

  it("returns null bounds for empty ink", () => {
    expect(inkBounds([])).toBeNull();
  });
});