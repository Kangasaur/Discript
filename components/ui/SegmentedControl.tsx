import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import type { ScriptColors } from "@/types/data";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  colors: ScriptColors;
  style?: StyleProp<ViewStyle>;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  colors,
  style,
}: Props<T>) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentSelected,
              pressed && !selected && styles.segmentPressed,
            ]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ScriptColors) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignSelf: "flex-start",
      borderWidth: 2,
      borderColor: colors.accent,
      borderRadius: 10,
      padding: 3,
      gap: 3,
    },
    segment: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 7 },
    segmentSelected: { backgroundColor: colors.accent },
    segmentPressed: { backgroundColor: colors.primary },
    label: { fontSize: 14, fontFamily: "NotoSerif_400Regular", color: colors.muted },
    labelSelected: { color: colors.background, fontFamily: "NotoSerif_600SemiBold" },
  });
}