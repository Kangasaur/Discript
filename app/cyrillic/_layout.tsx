import { Slot } from "expo-router";
import { ScriptThemeProvider } from "@/contexts/ScriptTheme";

export default function CyrillicLayout() {
  return (
    <ScriptThemeProvider scriptId="cyrillic">
      <Slot />
    </ScriptThemeProvider>
  );
}
