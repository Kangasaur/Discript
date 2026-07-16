import { useEffect, useMemo, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ScriptColors } from "@/types/data";
import type { HandwritingCharacter, LetterCase } from "@/types/handwriting";
import { glyphFor } from "@/data/handwriting";

interface Props {
  characters: HandwritingCharacter[];
  value: string;
  letterCase: LetterCase;
  colors: ScriptColors;
  onChange: (key: string) => void;
}

export default function CharacterPicker({ characters, value, letterCase, colors, onChange }: Props) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scrollRef = useRef<ScrollView>(null);
  const chipLayouts = useRef<Record<string, { x: number; width: number }>>({});
  const viewportWidth = useRef(0);

  const index = Math.max(
    0,
    characters.findIndex((c) => c.key === value),
  );

  useEffect(() => {
    const layout = chipLayouts.current[value];
    if (!layout || viewportWidth.current <= 0) return;
    const x = Math.max(0, layout.x - viewportWidth.current / 2 + layout.width / 2);
    scrollRef.current?.scrollTo({ x, animated: true });
  }, [value]);

  const step = (delta: number) => {
    const next = characters[(index + delta + characters.length) % characters.length];
    if (next) onChange(next.key);
  };

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous character"
        onPress={() => step(-1)}
        style={({ pressed }) => [styles.arrow, pressed && styles.arrowPressed]}
      >
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onLayout={(e) => {
          viewportWidth.current = e.nativeEvent.layout.width;
        }}
      >
        {characters.map((character) => {
          const selected = character.key === value;
          return (
            <Pressable
              key={character.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onLayout={(e) => {
                chipLayouts.current[character.key] = {
                  x: e.nativeEvent.layout.x,
                  width: e.nativeEvent.layout.width,
                };
              }}
              onPress={() => onChange(character.key)}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                pressed && !selected && styles.chipPressed,
              ]}
            >
              <Text style={[styles.glyph, selected && styles.glyphSelected]}>
                {glyphFor(character, letterCase)}
              </Text>
              <Text style={[styles.latin, selected && styles.latinSelected]} numberOfLines={1}>
                {character.latin}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next character"
        onPress={() => step(1)}
        style={({ pressed }) => [styles.arrow, pressed && styles.arrowPressed]}
      >
        <Text style={styles.arrowText}>›</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: ScriptColors) {
  return StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 6 },
    scroll: { flex: 1 },
    scrollContent: { gap: 8, paddingHorizontal: 2, paddingVertical: 2 },
    arrow: {
      width: 34,
      height: 56,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.accent,
    },
    arrowPressed: { backgroundColor: colors.primary },
    arrowText: {
      fontSize: 22,
      lineHeight: 26,
      fontFamily: "NotoSerif_600SemiBold",
      color: colors.onPrimary,
    },
    chip: {
      minWidth: 52,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    chipSelected: { backgroundColor: colors.accent },
    chipPressed: { backgroundColor: colors.primary },
    glyph: {
      fontSize: 24,
      lineHeight: 30,
      fontFamily: "NotoSerif_400Regular",
      color: colors.onPrimary,
    },
    glyphSelected: { color: colors.background },
    latin: { fontSize: 11, fontFamily: "NotoSerif_400Regular", color: colors.muted },
    latinSelected: { color: colors.background, fontFamily: "NotoSerif_600SemiBold" },
  });
}