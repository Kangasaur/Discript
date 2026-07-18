import type { ImageSourcePropType } from "react-native";
export type LetterCase = "upper" | "lower";
/** One touch point. `t` is ms since the first touch of the sample. */
export interface InkPoint {
  x: number;
  y: number;
  t: number;
}
/** A single pen-down..pen-up sequence. */
export type InkStroke = InkPoint[];
/** Serialized point: [x, y, t] */
export type PointTriplet = [number, number, number];
/**
 * Static per-script registry of stroke-order diagrams, keyed by `Entry.key`.
 * This is the only handwriting data that lives in code — labels/glyphs come
 * from the lesson entries.
 */
export interface ScriptDiagramSet {
  scriptId: string;
  /** intrinsic pixel size of the diagram images */
  diagramSize: { width: number; height: number };
  /** region of the diagram (in source px) that should line up with the canvas */
  diagramCrop: { x: number; y: number; width: number; height: number };
  diagrams: Record<string, Partial<Record<LetterCase, ImageSourcePropType>>>;
}
/** A lesson `Entry` joined with its stroke diagrams. Built at runtime. */
export interface HandwritingCharacter {
  /** Entry.key */
  key: string;
  /** Entry.latin — the romanization shown everywhere in the UI */
  latin: string;
  /** Entry.character — base / lowercase glyph */
  character: string;
  /** Entry.upper — capital glyph, when the script has one */
  upper?: string;
  diagrams: Partial<Record<LetterCase, ImageSourcePropType>>;
}
export interface HandwritingScript {
  id: string;
  name: string;
  diagramSize: { width: number; height: number };
  diagramCrop: { x: number; y: number; width: number; height: number };
  characters: HandwritingCharacter[];
}
export interface SampleLabel {
  script: string;
  key: string;
  latin: string;
  case: LetterCase;
  character?: string;
}
/**
 * One collected handwriting sample.
 *
 * `ink` keeps the untouched point sequence (so we can refit to Bézier curves
 * later, per Carbune et al. 2020 §"Bézier curves"), `features` is the simple
 * point-sequence representation used as the paper's raw-touch-point baseline.
 */
export interface HandwritingSample {
  id: string;
  label: SampleLabel;
  createdAt: string;
  canvas: { width: number; height: number };
  ink: {
    format: string;
    units: "canvas-px";
    strokes: PointTriplet[][];
  };
  features: {
    format: string;
    dims: string[];
    normalization: {
      reference: "ink-bbox-height";
      scale: number;
      center: { x: number; y: number };
    };
    points: number[][];
  };
  stats: { strokeCount: number; pointCount: number; durationMs: number };
  device: { os: string; osVersion: string };
}