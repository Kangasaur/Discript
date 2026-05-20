import { createContext, useContext, useMemo, type ReactNode } from "react";
import scriptsData from "@/data/scripts.json";
import type { Script } from "@/types/data";

const scripts = scriptsData as Script[];

const ScriptThemeContext = createContext<Script | null>(null);

interface ProviderProps {
  scriptId: string;
  children: ReactNode;
}

export function ScriptThemeProvider({ scriptId, children }: ProviderProps) {
  const script = useMemo(() => {
    const found = scripts.find((s) => s.id === scriptId);
    if (!found) throw new Error(`Unknown script id: ${scriptId}`);
    return found;
  }, [scriptId]);

  return (
    <ScriptThemeContext.Provider value={script}>
      {children}
    </ScriptThemeContext.Provider>
  );
}

export function useScriptTheme(): Script {
  const ctx = useContext(ScriptThemeContext);
  if (!ctx) {
    throw new Error("useScriptTheme must be used inside ScriptThemeProvider");
  }
  return ctx;
}

export function getAllScripts(): Script[] {
  return scripts;
}
