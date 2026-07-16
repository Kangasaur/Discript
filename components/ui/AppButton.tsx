import { useMemo } from "react";
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import type { ScriptColors } from "@/types/data";

export type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface Props {
  label: string;
  onPress: () => void;
  colors: ScriptColors;
  variant?: AppButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const DANGER = "#ef4444";

export default function AppButton({
  label,
  onPress,
  colors,
  variant = "primary",
  disabled = false,
  style,
}: Props) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled && styles[`${variant}Pressed` as const],
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, styles[`${variant}Label` as const]]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function makeStyles(colors: ScriptColors) {
  return StyleSheet.create({
    base: {
      minHeight: 48,
      paddingHorizontal: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    label: { fontSize: 16, fontFamily: "NotoSerif_600SemiBold" },
    disabled: { opacity: 0.4 },

    primary: { backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.accent },
    primaryPressed: { backgroundColor: colors.accentPressed },
    primaryLabel: { color: colors.onPrimary },

    secondary: { borderWidth: 2, borderColor: colors.accent, backgroundColor: "transparent" },
    secondaryPressed: { backgroundColor: colors.primary },
    secondaryLabel: { color: colors.onPrimary },

    ghost: { backgroundColor: "transparent", minHeight: 40 },
    ghostPressed: { opacity: 0.6 },
    ghostLabel: { color: colors.muted, fontFamily: "NotoSerif_400Regular" },

    danger: { borderWidth: 2, borderColor: DANGER, backgroundColor: "transparent" },
    dangerPressed: { backgroundColor: "rgba(239,68,68,0.15)" },
    dangerLabel: { color: DANGER },
  });
}