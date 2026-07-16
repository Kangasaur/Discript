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

export interface HandwritingCharacter {
  /** stable id, safe for filenames, e.g. "zh" / "hard_sign" */
  key: string;
  /** romanization shown as the prompt, e.g. "zh" */
  latin: string;
  /** optional human name for letters with no real romanization */
  name?: string;
  glyphs: Partial<Record<LetterCase, string>>;
  /** A case is only collectable if it has a stroke diagram. */
  diagrams: Partial<Record<LetterCase, ImageSourcePropType>>;
}

export interface HandwritingScript {
  id: string;
  name: string;
  /** intrinsic pixel size of the stroke diagrams */
  diagramSize: { width: number; height: number };
  /** region of the diagram (in source px) that should line up with the canvas */
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