/** console.warn that is a no-op in production and safe outside the RN runtime (vitest). */
export function devWarn(message: string, ...rest: unknown[]): void {
  if (typeof __DEV__ !== "undefined" && __DEV__) console.warn(message, ...rest);
}