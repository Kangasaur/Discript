import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { DEV_THEME } from "@/utils/devTheme";

const TOOLS = [
  {
    href: "/dev/handwriting",
    title: "Handwriting data collection",
    description: "Capture labelled ink samples for the writing-quiz recognizer, then export them.",
  },
] as const;

export default function DevIndexScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.note}>Development builds only.</Text>
        {TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href} asChild>
            <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
              <Text style={styles.cardTitle}>{tool.title}</Text>
              <Text style={styles.cardDescription}>{tool.description}</Text>
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DEV_THEME.background },
  content: { padding: 20, gap: 12 },
  note: {
    fontSize: 12,
    fontFamily: "NotoSerif_300Light_Italic",
    color: DEV_THEME.textMuted,
  },
  card: {
    borderWidth: 1,
    borderColor: DEV_THEME.cardBorder,
    backgroundColor: DEV_THEME.primary,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  cardPressed: { opacity: 0.8 },
  cardTitle: { fontSize: 17, fontFamily: "NotoSerif_600SemiBold", color: DEV_THEME.text },
  cardDescription: { fontSize: 13, fontFamily: "NotoSerif_400Regular", color: DEV_THEME.textMuted },
});