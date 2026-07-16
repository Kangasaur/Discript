import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ScriptColors } from "@/types/data";
import type { LetterCase } from "@/types/handwriting";

interface Props {
  latin: string;
  letterCase: LetterCase;
  colors: ScriptColors;
  name?: string;
  instruction?: string;
  sampleCount?: number;
}

export default function WritingPrompt({
  latin,
  letterCase,
  colors,
  name,
  instruction = "Write this letter",
  sampleCount,
}: Props) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const caseLabel = letterCase === "upper" ? "Uppercase" : "Lowercase";

  return (
    <View style={styles.card}>
      <Text style={styles.instruction}>{instruction}</Text>
      <Text style={styles.latin} accessibilityLabel={`${caseLabel} ${name ?? latin}`}>
        {latin}
      </Text>
      <Text style={styles.meta}>{name ? `${caseLabel} · ${name}` : caseLabel}</Text>
      {sampleCount !== undefined ? (
        <Text style={styles.count}>
          {sampleCount} sample{sampleCount === 1 ? "" : "s"} saved for this label
        </Text>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ScriptColors) {
  return StyleSheet.create({
    card: {
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.accent,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      gap: 2,
    },
    instruction: {
      fontSize: 13,
      fontFamily: "NotoSerif_300Light_Italic",
      color: colors.muted,
    },
    latin: {
      fontSize: 44,
      lineHeight: 58,
      fontFamily: "NotoSerif_700Bold",
      color: colors.onPrimary,
    },
    meta: {
      fontSize: 15,
      fontFamily: "NotoSerif_600SemiBold",
      color: colors.accent,
    },
    count: {
      marginTop: 4,
      fontSize: 12,
      fontFamily: "NotoSerif_400Regular",
      color: colors.muted,
    },
  });
}