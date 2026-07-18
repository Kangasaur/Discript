import { Redirect, Stack } from "expo-router";
import { DEV_THEME } from "@/utils/devTheme";

export default function DevLayout() {
  // Dev tools never ship.
  if (!__DEV__) return <Redirect href="/" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: DEV_THEME.primary },
        headerTintColor: DEV_THEME.onPrimary,
        headerTitleStyle: { fontFamily: "NotoSerif_600SemiBold" },
        contentStyle: { backgroundColor: DEV_THEME.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Dev Tools" }} />
      <Stack.Screen name="handwriting" options={{ title: "Handwriting Data" }} />
      <Stack.Screen name="migrate" options={{ title: "Data Migration" }} />
    </Stack>
  );
}