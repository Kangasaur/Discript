import { useRouter, type Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { getAllScripts } from "@/contexts/ScriptTheme";
import appTheme from "@/data/app.json";
import type { AppTheme, Script } from "@/types/data";

// TODO: read last-opened script id from local storage and `router.replace`
// to that route before rendering the landing UI.

const theme = appTheme as AppTheme;

export default function Index() {
  const router = useRouter();
  const scripts = getAllScripts();

  function openScript(scriptId: string) {
    router.push(`/${scriptId}` as Href);
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      <Text style={styles.title}>{theme.name}</Text>
      <Text style={styles.tagline}>{theme.tagline}</Text>

      <Text style={styles.pickerLabel}>What are you learning?</Text>
      <View style={styles.pickerList}>
        {scripts.map((script) => (
          <ScriptCard key={script.id} script={script} onPress={openScript} />
        ))}
      </View>
    </ScrollView>
  );
}

interface ScriptCardProps {
  script: Script;
  onPress: (id: string) => void;
}

function ScriptCard({ script, onPress }: ScriptCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: script.colors.background },
        pressed && styles.cardPressed,
      ]}
      onPress={() => onPress(script.id)}
    >
      <Text style={[styles.cardIcon, { color: script.colors.onPrimary }]}>
        {script.icon}
      </Text>
      <Text style={[styles.cardName, { color: script.colors.onPrimary }]}>
        {script.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 44,
    fontFamily: "NotoSerif_700Bold",
    color: theme.colors.text,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    fontFamily: "NotoSerif_300Light_Italic",
    color: theme.colors.textMuted,
    marginBottom: 48,
    textAlign: "center",
    maxWidth: 320,
  },
  pickerLabel: {
    fontSize: 13,
    fontFamily: "NotoSerif_600SemiBold",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  pickerList: {
    width: "100%",
    maxWidth: 360,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardIcon: {
    fontSize: 32,
    fontFamily: "NotoSerif_400Regular",
    width: 56,
    textAlign: "center",
  },
  cardName: {
    fontSize: 20,
    fontFamily: "NotoSerif_700Bold",
    marginLeft: 12,
  },
});
