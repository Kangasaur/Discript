import type { HandwritingSample, InkStroke } from "@/types/handwriting";
import { FEATURE_FORMAT, RAW_INK_FORMAT, countPoints, inkDurationMs } from "./ink";
import { buildFeatures } from "./handwritingSamples";
import { loadAllSamples, saveSample } from "./handwritingStorage";
export interface MigrationScan {
  total: number;
  /** already on the current feature format */
  current: number;
  /** old format, raw ink present -> can be upgraded */
  upgradable: number;
  /** old format but no raw ink to rebuild from */
  unreadable: number;
  /** breakdown by features.format */
  formats: Record<string, number>;
}
export interface MigrationResult {
  migrated: number;
  skipped: number;
  failed: { id: string; error: string }[];
}
function hasRawInk(sample: HandwritingSample): boolean {
  return Array.isArray(sample?.ink?.strokes) && sample.ink.strokes.length > 0;
}
/** True for any sample not fully on the current (v2) schema. Idempotent-safe. */
export function needsUpgrade(sample: HandwritingSample): boolean {
  return (
    sample?.features?.format !== FEATURE_FORMAT ||
    !sample.features?.resampling ||
    typeof sample.stats?.featurePointCount !== "number" ||
    sample.features?.points[1][2] > 1 
  );
}
/**
 * Rebuild the derived fields (features + stats) from the sample's raw ink.
 * id, label, createdAt, canvas, ink and device are preserved, so label counts
 * and rejects files keyed by sample id remain valid.
 */
export function upgradeSample(sample: HandwritingSample): HandwritingSample {
  if (!hasRawInk(sample)) {
    throw new Error("no raw ink (ink.strokes) to rebuild features from");
  }
  const strokes: InkStroke[] = sample.ink.strokes.map((stroke) =>
    stroke.map(([x, y, t]) => ({ x, y, t })),
  );
  const features = buildFeatures(strokes);
  return {
    ...sample,
    ink: { format: RAW_INK_FORMAT, units: "canvas-px", strokes: sample.ink.strokes },
    features,
    stats: {
      strokeCount: strokes.length,
      pointCount: countPoints(strokes),
      featurePointCount: features.points.length,
      durationMs: inkDurationMs(strokes),
    },
  };
}
/** Dry run: classify everything in local storage without writing. */
export async function scanSamples(): Promise<MigrationScan> {
  const samples = await loadAllSamples();
  const scan: MigrationScan = {
    total: samples.length,
    current: 0,
    upgradable: 0,
    unreadable: 0,
    formats: {},
  };
  for (const sample of samples) {
    const format = sample?.features?.format ?? "unknown";
    scan.formats[format] = (scan.formats[format] ?? 0) + 1;
    if (!needsUpgrade(sample)) scan.current++;
    else if (hasRawInk(sample)) scan.upgradable++;
    else scan.unreadable++;
  }
  return scan;
}
/** Upgrade every out-of-date stored sample in place (same ids, same files). */
export async function migrateAllSamples(
  onProgress?: (done: number, total: number) => void,
): Promise<MigrationResult> {
  const samples = await loadAllSamples();
  const result: MigrationResult = { migrated: 0, skipped: 0, failed: [] };
  let done = 0;
  for (const sample of samples) {
    try {
      if (!needsUpgrade(sample)) {
        result.skipped++;
      } else {
        await saveSample(upgradeSample(sample));
        result.migrated++;
      }
    } catch (error) {
      result.failed.push({ id: sample?.id ?? "unknown", error: (error as Error).message });
    }
    done++;
    onProgress?.(done, samples.length);
  }
  return result;
}