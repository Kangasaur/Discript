
import type { HandwritingCharacter, HandwritingScript, LetterCase } from "@/types/handwriting";
import { CYRILLIC_HANDWRITING } from "./cyrillic";

export const HANDWRITING_SCRIPTS: HandwritingScript[] = [CYRILLIC_HANDWRITING];

export function getHandwritingScript(id: string): HandwritingScript | undefined {
  return HANDWRITING_SCRIPTS.find((s) => s.id === id);
}

export function getHandwritingCharacter(
  script: HandwritingScript,
  key: string,
): HandwritingCharacter | undefined {
  return script.characters.find((c) => c.key === key);
}

/** A case is collectable only when a stroke diagram exists for it. */
export function availableCases(character: HandwritingCharacter): LetterCase[] {
  return (["upper", "lower"] as LetterCase[]).filter((c) => Boolean(character.diagrams[c]));
}

export function glyphFor(character: HandwritingCharacter, letterCase: LetterCase): string {
  return character.glyphs[letterCase] ?? character.glyphs.lower ?? character.glyphs.upper ?? "?";
}