import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { useScriptTheme } from "@/contexts/ScriptTheme";
import type { ScriptColors } from "@/types/data";

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
}

export default function LessonButton({ label, onPress, loading }: Props) {
  const { colors } = useScriptTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        loading && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

function makeStyles(colors: ScriptColors) {
  return StyleSheet.create({
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 12,
      marginVertical: 8,
      minWidth: 220,
      alignItems: "center",
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    label: {
      color: colors.onPrimary,
      fontSize: 18,
      fontFamily: "NotoSerif_700Bold",
    },
  });
}
