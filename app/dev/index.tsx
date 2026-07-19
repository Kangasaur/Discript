import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import appTheme from "@/data/app.json";
import type { AppTheme } from "@/types/data";

const theme = (appTheme as AppTheme).colors;

const TOOLS = [
  {
    href: "/dev/handwriting",
    title: "Handwriting data collection",
    description: "Capture labelled ink samples for the writing-quiz recognizer, then export them.",
  },
  {
    href: "/dev/migrate",
    title: "Sample schema migration",
    description: "Upgrade locally stored handwriting samples to the latest feature format.",
},
] as const;

export default function DevIndexScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.note}>Development builds only.</Text>
        {TOOLS.map((tool) => (
          <Pressable key={tool.href} onPress={() => router.push(tool.href)} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
            <Text style={styles.cardTitle}>{tool.title}</Text>
            <Text style={styles.cardDescription}>{tool.description}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { padding: 20, gap: 12 },
  note: {
    fontSize: 12,
    fontFamily: "NotoSerif_300Light_Italic",
    color: theme.textMuted,
  },
  card: {
    borderWidth: 2,
    borderColor: theme.cardBorder,
    borderRadius: 12,
    padding: 16,
  },
  cardPressed: { opacity: 0.8 },
  cardTitle: { fontSize: 17, fontFamily: "NotoSerif_600SemiBold", color: theme.text },
  cardDescription: { fontSize: 13, fontFamily: "NotoSerif_400Regular", color: theme.textMuted },
});