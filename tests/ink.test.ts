import { describe, expect, it } from "vitest";
import {
  inkBounds,
  normalizeStrokes,
  resampleStroke,
  resampleStrokes,
  serializeStrokes,
  strokeLength,
  toPointDeltaSequence,
} from "@/utils/ink";
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
describe("ink geometry", () => {
  it("computes the ink bounding box", () => {
    expect(inkBounds(strokes)).toMatchObject({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
  });
  it("normalizes the bbox height to 1 and centres the ink", () => {
    const normalized = normalizeStrokes(strokes);
    expect(normalized.scale).toBeCloseTo(0.1);
    expect(normalized.strokes[0][0]).toMatchObject({ x: -0.5, y: -0.5 });
    expect(normalized.strokes[1][1]).toMatchObject({ x: 0.5, y: 0.5 });
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
describe("resampling", () => {
  const line: InkStroke = [
    { x: 0, y: 0, t: 0 },
    { x: 1, y: 0, t: 100 },
  ];
  it("gives a unit-length line 20 points at delta = 0.05", () => {
    expect(resampleStroke(line, 0.05)).toHaveLength(20);
  });
  it("keeps both endpoints and spaces points equidistantly", () => {
    const out = resampleStroke(line, 0.05);
    expect(out[0]).toMatchObject({ x: 0, y: 0 });
    expect(out[out.length - 1].x).toBeCloseTo(1);
    const gaps = out.slice(1).map((p, i) => p.x - out[i].x);
    for (const gap of gaps) expect(gap).toBeCloseTo(gaps[0]);
    expect(gaps[0]).toBeCloseTo(1 / 19);
  });
  it("interpolates timestamps linearly", () => {
    const out = resampleStroke(line, 0.05);
    expect(out[1].t).toBeCloseTo(100 / 19);
    expect(out[out.length - 1].t).toBeCloseTo(100);
  });
  it("follows corners of a polyline", () => {
    const corner: InkStroke = [
      { x: 0, y: 0, t: 0 },
      { x: 1, y: 0, t: 50 },
      { x: 1, y: 1, t: 100 },
    ];
    const out = resampleStroke(corner, 0.05);
    expect(out).toHaveLength(40);
    expect(strokeLength(out)).toBeCloseTo(2, 5);
  });
  it("keeps dots and zero-length strokes as a single point", () => {
    expect(resampleStroke([{ x: 5, y: 5, t: 0 }])).toHaveLength(1);
    expect(
      resampleStroke([
        { x: 5, y: 5, t: 0 },
        { x: 5, y: 5, t: 12 },
      ]),
    ).toHaveLength(1);
  });
  it("resamples every stroke independently", () => {
    const normalized = normalizeStrokes(strokes);
    const resampled = resampleStrokes(normalized.strokes, 0.05);
    expect(resampled).toHaveLength(2);
    expect(resampled[0]).toHaveLength(20); // each stroke is 1.0 long after normalization
  });
});
describe("delta encoding", () => {
  it("emits [dx, dy, dt, pen_up] per point with pen-up at stroke ends", () => {
    expect(toPointDeltaSequence(strokes)).toEqual([
      [0, 0, 0, 0],
      [10, 0, 16, 1],
      [-10, 10, 84, 0],
      [10, 0, 16, 1],
    ]);
  });
});