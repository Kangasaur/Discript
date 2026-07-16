import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { DEV_THEME } from "@/utils/devTheme";

interface Props {
  style?: StyleProp<ViewStyle>;
}

/** Renders nothing outside of dev builds. */
export default function DevMenuButton({ style }: Props) {
  if (!__DEV__) return null;

  return (
    <Link href="/dev" asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open dev tools"
        hitSlop={8}
        style={({ pressed }) => [styles.pill, pressed && styles.pressed, style]}
      >
        <Text style={styles.text}>DEV TOOLS</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "center",
    marginTop: 24,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DEV_THEME.cardBorder,
    opacity: 0.7,
  },
  pressed: { opacity: 1, backgroundColor: DEV_THEME.primary },
  text: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontFamily: "NotoSerif_600SemiBold",
    color: DEV_THEME.textMuted,
  },
});