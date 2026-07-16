import type { InkPoint, InkStroke, PointTriplet } from "@/types/handwriting";

export const RAW_INK_FORMAT = "raw-touch-points/v1";
export const FEATURE_FORMAT = "point-deltas/v1";
/** Per-point feature vector of the paper's raw touch-point baseline. */
export const FEATURE_DIMS = ["dx", "dy", "dt_ms", "pen_up"];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function round(value: number, precision = 2): number {
  const f = 10 ** precision;
  return Math.round(value * f) / f;
}

export interface InkBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export function inkBounds(strokes: InkStroke[]): InkBounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const stroke of strokes) {
    for (const p of stroke) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }
  if (!Number.isFinite(minX)) return null;
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export function countPoints(strokes: InkStroke[]): number {
  return strokes.reduce((n, s) => n + s.length, 0);
}

export function inkDurationMs(strokes: InkStroke[]): number {
  let last = 0;
  for (const stroke of strokes) {
    for (const p of stroke) if (p.t > last) last = p.t;
  }
  return Math.round(last);
}

/** Lossless-ish serialization of the captured point sequence. */
export function serializeStrokes(strokes: InkStroke[], precision = 2): PointTriplet[][] {
  return strokes.map((stroke) =>
    stroke.map((p) => [round(p.x, precision), round(p.y, precision), Math.round(p.t)] as PointTriplet),
  );
}

export interface NormalizedInk {
  strokes: InkStroke[];
  /** multiply raw px by this to get normalized units */
  scale: number;
  /** raw-px point mapped to the origin */
  center: { x: number; y: number };
}

/**
 * Scale/translate the ink so its bounding box height spans 1.0 and its centre
 * sits at the origin. Screen orientation is kept (y grows downwards).
 */
export function normalizeStrokes(strokes: InkStroke[]): NormalizedInk {
  const b = inkBounds(strokes);
  if (!b) return { strokes: [], scale: 1, center: { x: 0, y: 0 } };

  const reference = b.height > 1 ? b.height : b.width > 1 ? b.width : 1;
  const scale = 1 / reference;
  const center = { x: b.minX + b.width / 2, y: b.minY + b.height / 2 };

  return {
    scale,
    center,
    strokes: strokes.map((stroke) =>
      stroke.map((p) => ({ x: (p.x - center.x) * scale, y: (p.y - center.y) * scale, t: p.t })),
    ),
  };
}

/**
 * The "simple" point-sequence input representation: the whole ink is one
 * sequence, each point contributes [dx, dy, dt, pen_up], where pen_up marks the
 * last point of a stroke (so the following delta is the pen-up jump).
 */
export function toPointDeltaSequence(strokes: InkStroke[], precision = 4): number[][] {
  const out: number[][] = [];
  let prev: InkPoint | null = null;

  for (const stroke of strokes) {
    for (let i = 0; i < stroke.length; i++) {
      const p = stroke[i];
      const dx = prev ? p.x - prev.x : 0;
      const dy = prev ? p.y - prev.y : 0;
      const dt = prev ? p.t - prev.t : 0;
      out.push([round(dx, precision), round(dy, precision), Math.round(dt), i === stroke.length - 1 ? 1 : 0]);
      prev = p;
    }
  }
  return out;
}

/** Display only: quadratic midpoint smoothing. Never mutates captured data. */
export function strokeToSvgPath(stroke: InkStroke): string {
  if (stroke.length === 0) return "";
  const first = stroke[0];
  if (stroke.length === 1) return `M ${first.x} ${first.y} l 0.01 0`;

  let d = `M ${first.x} ${first.y}`;
  for (let i = 1; i < stroke.length - 1; i++) {
    const p = stroke[i];
    const next = stroke[i + 1];
    d += ` Q ${p.x} ${p.y} ${(p.x + next.x) / 2} ${(p.y + next.y) / 2}`;
  }
  const last = stroke[stroke.length - 1];
  return `${d} L ${last.x} ${last.y}`;
}