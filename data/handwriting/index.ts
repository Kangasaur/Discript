import { getEntries, getScriptMeta } from "@/data/lessons";
import type {
  HandwritingCharacter,
  HandwritingScript,
  LetterCase,
  ScriptDiagramSet,
} from "@/types/handwriting";
import { devWarn } from "@/utils/devWarn";
import { CYRILLIC_DIAGRAMS } from "./cyrillic";

// ── Add a diagram set per script here ─────────────────────────────────────────
const DIAGRAM_SETS: ScriptDiagramSet[] = [CYRILLIC_DIAGRAMS];
// ─────────────────────────────────────────────────────────────────────────────
let cache: HandwritingScript[] | null = null;
/** Scripts with stroke diagrams, each character joined from its lesson Entry. */
export function getHandwritingScripts(): HandwritingScript[] {
  if (!cache) cache = DIAGRAM_SETS.map(buildScript);
  return cache;
}
export function getHandwritingScript(scriptId: string): HandwritingScript | undefined {
  return getHandwritingScripts().find((script) => script.id === scriptId);
}
export function getHandwritingCharacter(
  script: HandwritingScript,
  key: string,
): HandwritingCharacter | undefined {
  return script.characters.find((character) => character.key === key);
}
/** A case is collectable only when a stroke diagram exists for it. */
export function availableCases(character: HandwritingCharacter): LetterCase[] {
  return (["upper", "lower"] as LetterCase[]).filter((c) => Boolean(character.diagrams[c]));
}
export function glyphFor(character: HandwritingCharacter, letterCase: LetterCase): string {
  if (letterCase === "upper") return character.upper ?? character.character;
  return character.character;
}
function buildScript(set: ScriptDiagramSet): HandwritingScript {
  const characters: HandwritingCharacter[] = [];
  const seen = new Set<string>();
  const unkeyed: string[] = [];
  const undrawn: string[] = [];
  for (const entry of getEntries(set.scriptId)) {
    if (!entry.key) {
      unkeyed.push(entry.character);
      continue;
    }
    if (seen.has(entry.key)) continue; // first lesson wins
    const diagrams = set.diagrams[entry.key];
    if (!diagrams || (!diagrams.upper && !diagrams.lower)) {
      undrawn.push(entry.key);
      continue;
    }
    seen.add(entry.key);
    characters.push({
      key: entry.key,
      latin: entry.latin,
      character: entry.character,
      upper: entry.upper,
      diagrams,
    });
  }
  if (unkeyed.length) {
    devWarn(
      `[handwriting] ${set.scriptId}: ${unkeyed.length} entr${unkeyed.length === 1 ? "y has" : "ies have"} no "key" and were skipped:`,
      unkeyed.join(" "),
    );
  }
  if (undrawn.length) {
    devWarn(`[handwriting] ${set.scriptId}: no stroke diagram for key(s):`, undrawn.join(", "));
  }
  return {
    id: set.scriptId,
    name: getScriptMeta(set.scriptId)?.name ?? set.scriptId,
    diagramSize: set.diagramSize,
    diagramCrop: set.diagramCrop,
    characters,
  };
}