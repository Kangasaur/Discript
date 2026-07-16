import appData from "@/data/app.json";
import scriptsData from "@/data/scripts.json";
import type { Script, ScriptColors } from "@/types/data";

const rawApp = appData as any;
const appColors = rawApp?.colors ?? rawApp?.theme?.colors ?? {};

/** Neutral chrome for the dev area, borrowed from the app theme when present. */
export const DEV_THEME = {
  background: appColors.background ?? "#14110e",
  primary: appColors.primary ?? "#2b2620",
  onPrimary: appColors.onPrimary ?? "#f6f1e7",
  text: appColors.text ?? "#f6f1e7",
  textMuted: appColors.textMuted ?? "#9c958a",
  cardBorder: appColors.cardBorder ?? "#3a352f",
};

export const DEV_FALLBACK_COLORS: ScriptColors = {
  background: DEV_THEME.background,
  primary: DEV_THEME.primary,
  accent: DEV_THEME.cardBorder,
  accentPressed: DEV_THEME.textMuted,
  muted: DEV_THEME.textMuted,
  onPrimary: DEV_THEME.onPrimary,
};

function readScripts(): Script[] {
  const data = scriptsData as any;
  if (Array.isArray(data)) return data as Script[];
  if (Array.isArray(data?.scripts)) return data.scripts as Script[];
  if (data && typeof data === "object") {
    return Object.values(data).filter((v: any) => v && typeof v === "object" && v.colors) as Script[];
  }
  return [];
}

/** Real per-script palette, so dev screens match the live UI. */
export function resolveScriptColors(scriptId: string): ScriptColors {
  return readScripts().find((s) => s.id === scriptId)?.colors ?? DEV_FALLBACK_COLORS;
}