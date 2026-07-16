import { useMemo } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import type { ScriptColors } from "@/types/data";

interface Props {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: ScriptColors;
  description?: string;
}

export default function ToggleRow({ label, value, onValueChange, colors, description }: Props) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.primary, true: colors.accent }}
        thumbColor={value ? colors.onPrimary : colors.muted}
        ios_backgroundColor={colors.primary}
      />
    </View>
  );
}

function makeStyles(colors: ScriptColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      borderWidth: 2,
      borderColor: colors.accent,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    text: { flex: 1, gap: 2 },
    label: { fontSize: 15, fontFamily: "NotoSerif_600SemiBold", color: colors.onPrimary },
    description: { fontSize: 12, fontFamily: "NotoSerif_300Light_Italic", color: colors.muted },
  });
}