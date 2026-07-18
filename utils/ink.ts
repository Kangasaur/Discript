import type { InkPoint, InkStroke, PointTriplet } from "@/types/handwriting";

export const RAW_INK_FORMAT = "raw-touch-points/v1";
// v2: normalized coords are now equidistantly resampled before delta encoding.
export const FEATURE_FORMAT = "point-deltas/v2";
/** Per-point feature vector of the paper's raw touch-point baseline. */
export const FEATURE_DIMS = ["dx", "dy", "dt_ms", "pen_up"];
/** Resampling spacing in normalized units (ink bbox height == 1). */
export const RESAMPLE_DELTA = 0.05;

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

export function strokeLength(stroke: InkStroke): number {
  let length = 0;
  for (let i = 1; i < stroke.length; i++) {
    length += Math.hypot(stroke[i].x - stroke[i - 1].x, stroke[i].y - stroke[i - 1].y);
  }
  return length;
}
/**
 * Equidistant linear resampling along a stroke (Carbune et al. 2020 preprocessing).
 *
 * Must run AFTER normalizeStrokes, since `delta` is in normalized units.
 * Point count is `max(2, round(L / delta))`, sampled with linspace over arc
 * length — so a line of length 1 with delta = 0.05 yields 20 points and both
 * endpoints are preserved (spacing L/(n-1), i.e. delta to within one interval).
 * For strict delta-stepping instead, use positions 0, δ, 2δ, … and drop the
 * trailing endpoint. Timestamps are interpolated linearly along each segment.
 */
export function resampleStroke(stroke: InkStroke, delta = RESAMPLE_DELTA): InkStroke {
  if (stroke.length <= 1) return stroke.slice();
  const cumulative: number[] = [0];
  for (let i = 1; i < stroke.length; i++) {
    cumulative.push(
      cumulative[i - 1] + Math.hypot(stroke[i].x - stroke[i - 1].x, stroke[i].y - stroke[i - 1].y),
    );
  }
  const total = cumulative[cumulative.length - 1];
  if (total <= 1e-9) return [stroke[0]]; // dot / tap
  const count = Math.max(2, Math.round(total / delta));
  const step = total / (count - 1);
  const resampled: InkStroke = [stroke[0]];
  let segment = 1;
  for (let i = 1; i < count - 1; i++) {
    const target = i * step;
    while (segment < cumulative.length - 1 && cumulative[segment] < target) segment++;
    const from = stroke[segment - 1];
    const to = stroke[segment];
    const segmentLength = cumulative[segment] - cumulative[segment - 1];
    const ratio = segmentLength > 1e-12 ? (target - cumulative[segment - 1]) / segmentLength : 0;
    resampled.push({
      x: from.x + (to.x - from.x) * ratio,
      y: from.y + (to.y - from.y) * ratio,
      t: from.t + (to.t - from.t) * ratio,
    });
  }
  resampled.push(stroke[stroke.length - 1]);
  return resampled;
}
export function resampleStrokes(strokes: InkStroke[], delta = RESAMPLE_DELTA): InkStroke[] {
  return strokes.map((stroke) => resampleStroke(stroke, delta));
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
      out.push([round(dx, precision), round(dy, precision), round(dt, 2), i === stroke.length - 1 ? 1 : 0]);
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