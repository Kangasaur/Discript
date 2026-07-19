import { Redirect, Stack } from "expo-router";
import appTheme from "@/data/app.json";
import type { AppTheme } from "@/types/data";

const theme = (appTheme as AppTheme).colors;

export default function DevLayout() {
  // Dev tools never ship.
  if (!__DEV__) return <Redirect href="/" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.primary },
        headerTintColor: theme.onPrimary,
        headerTitleStyle: { fontFamily: "NotoSerif_600SemiBold" },
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Dev Tools" }} />
      <Stack.Screen name="handwriting" options={{ title: "Handwriting Data" }} />
      <Stack.Screen name="migrate" options={{ title: "Data Migration" }} />
    </Stack>
  );
}