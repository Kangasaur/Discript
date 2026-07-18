import { Platform } from "react-native";
import type { HandwritingSample, InkStroke, SampleLabel } from "@/types/handwriting";
import {
  FEATURE_DIMS,
  FEATURE_FORMAT,
  RAW_INK_FORMAT,
  RESAMPLE_DELTA,
  countPoints,
  inkDurationMs,
  normalizeStrokes,
  resampleStrokes,
  serializeStrokes,
  toPointDeltaSequence,
} from "./ink";

export const EXPORT_SCHEMA_VERSION = 2;
const SEP = "--";

type LabelKeyParts = Pick<SampleLabel, "script" | "key" | "case">;

/** `cyrillic--zh--upper` */
export function labelId(label: LabelKeyParts): string {
  return [label.script, label.key, label.case].join(SEP);
}

/** `cyrillic--zh--upper--1718041000000-9fk2la` */
export function buildSampleId(label: LabelKeyParts, now = Date.now()): string {
  const suffix = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  return [label.script, label.key, label.case, suffix].join(SEP);
}

export function decodeSampleId(id: string): LabelKeyParts | null {
  const parts = id.split(SEP);
  if (parts.length < 4) return null;
  const [script, key, letterCase] = parts;
  if (letterCase !== "upper" && letterCase !== "lower") return null;
  return { script, key, case: letterCase };
}

export function sampleFileName(id: string): string {
  return `${id}.json`;
}

export function sampleIdFromFileName(name: string): string {
  return name.replace(/\.json$/i, "");
}

export function countsByLabel(ids: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of ids) {
    const parts = decodeSampleId(id);
    if (!parts) continue;
    const key = labelId(parts);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

/**
 * The v2 feature pipeline: normalize (centre + bbox height -> 1) ->
 * equidistant resample -> delta encode. Shared by buildSample and the
 * schema migration so both always agree.
 */
export function buildFeatures(strokes: InkStroke[]): HandwritingSample["features"] {
  const normalized = normalizeStrokes(strokes);
  const points = toPointDeltaSequence(resampleStrokes(normalized.strokes, RESAMPLE_DELTA));
  return {
    format: FEATURE_FORMAT,
    dims: FEATURE_DIMS,
    normalization: {
      reference: "ink-bbox-height",
      scale: normalized.scale,
      center: normalized.center,
    },
    resampling: { method: "equidistant-linear", delta: RESAMPLE_DELTA },
    points,
  };
}

export function buildSample(params: {
  label: SampleLabel;
  strokes: InkStroke[];
  canvas: { width: number; height: number };
  now?: number;
}): HandwritingSample {
  const { label, strokes, canvas, now = Date.now() } = params;
  const features = buildFeatures(strokes);
  return {
    id: buildSampleId(label, now),
    label,
    createdAt: new Date(now).toISOString(),
    canvas: { width: Math.round(canvas.width), height: Math.round(canvas.height) },
    ink: {
      format: RAW_INK_FORMAT,
      units: "canvas-px",
      strokes: serializeStrokes(strokes),
    },
    features,
    stats: {
      strokeCount: strokes.length,
      pointCount: countPoints(strokes),
      featurePointCount: features.points.length,
      durationMs: inkDurationMs(strokes),
    },
    device: { os: Platform.OS, osVersion: String(Platform.Version ?? "") },
  };
}

export interface ExportBundle {
  schemaVersion: number;
  exportedAt: string;
  inkFormat: string;
  featureFormat: string;
  featureDims: string[];
  notes: string;
  sampleCount: number;
  counts: Record<string, number>;
  samples: HandwritingSample[];
}

export function buildExportBundle(samples: HandwritingSample[], now = Date.now()): ExportBundle {
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date(now).toISOString(),
    inkFormat: RAW_INK_FORMAT,
    featureFormat: FEATURE_FORMAT,
    featureDims: FEATURE_DIMS,
    notes:
      "ink.strokes are raw canvas-pixel point sequences ([x, y, t_ms]) grouped per stroke. " +
      "features.points is the flattened per-point representation [dx, dy, dt_ms, pen_up] produced by: " +
      "(1) normalizing the ink so its bbox height spans 1.0 and its centre is the origin, " +
      `(2) equidistant linear resampling along each stroke with delta=${RESAMPLE_DELTA} ` +
      "(a stroke of length 1 yields 20 points; timestamps interpolated linearly), " +
      "(3) delta encoding, where pen_up marks the last point of a stroke. " +
      "Refit ink.strokes to Bezier curves when switching to the curve representation.",
    sampleCount: samples.length,
    counts: countsByLabel(samples.map((s) => s.id)),
    samples,
  };
}

export function exportFileName(now = new Date()): string {
  return `handwriting-${now.toISOString().replace(/[:.]/g, "-")}.json`;
}