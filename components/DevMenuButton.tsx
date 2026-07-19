import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import appTheme from "@/data/app.json";
import type { AppTheme } from "@/types/data";

const theme = (appTheme as AppTheme).colors;

interface Props {
  style?: StyleProp<ViewStyle>;
}

/** Renders nothing outside of dev builds. */
export default function DevMenuButton({ style }: Props) {
  if (!__DEV__) return null;

  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open dev tools"
      hitSlop={8}
      onPress={() => router.push("/dev")}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed, style]}
    >
      <Text style={styles.text}>DEV TOOLS</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "center",
    marginTop: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: theme.cardBorder,
    opacity: 0.7,
  },
  pressed: { opacity: 1, backgroundColor: theme.primary },
  text: {
    fontSize: 12,
    letterSpacing: 1.5,
    fontFamily: "NotoSerif_600SemiBold",
    color: theme.textMuted,
  },
});