export const DEFAULT_COUNT = 20;
export const MIN_COUNT = 1;
export const MAX_COUNT = 999;

export function clamp(n: number): number {
  return Math.min(MAX_COUNT, Math.max(MIN_COUNT, n));
}
