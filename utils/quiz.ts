import type { Entry } from "@/types/data";

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Build a queue of exactly `count` entries, reshuffling when exhausted.
// Avoids placing the same entry twice in a row across reshuffle boundaries.
export function buildQueue(entries: Entry[], count: number): Entry[] {
  const queue: Entry[] = [];
  let pool = shuffle(entries);
  while (queue.length < count) {
    if (pool.length === 0) {
      pool = shuffle(entries);
      // Avoid immediate repeat at reshuffle boundary
      if (
        queue.length > 0 &&
        pool.length > 1 &&
        pool[0].character === queue[queue.length - 1].character
      ) {
        const swap = Math.floor(Math.random() * (pool.length - 1)) + 1;
        [pool[0], pool[swap]] = [pool[swap], pool[0]];
      }
    }
    queue.push(pool.shift()!);
  }
  return queue;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
