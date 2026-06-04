import { useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useScriptTheme } from "@/contexts/ScriptTheme";
import { useAudioPlayer } from "expo-audio";
import type { Entry, ScriptColors } from "@/types/data";
import { cyrillicAudio } from "@/data/cyrillic/audio";

interface Props {
  entry: Entry;
  onPress?: () => void;
}

export default function CharacterRefButton({ entry, onPress }: Props) {
  const { colors } = useScriptTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const player = useAudioPlayer(
    entry.audioFile ? cyrillicAudio[entry.audioFile] : null,
  );

  function playSound() {
    if (entry.audioFile) {
      player.seekTo(0)
      player.play()
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress || playSound}
    >
        <Text style={styles.label}>{ entry.reference || entry.character }</Text>
        <Text style={styles.labelLatin}>{ entry.latin }</Text>
    </Pressable>
  );
}

function makeStyles(colors: ScriptColors) {
  return StyleSheet.create({
    button: {
      backgroundColor: colors.background,
      borderColor: colors.primary,
      borderWidth: 4,
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 12,
      marginVertical: 8,
      minWidth: 120,
      maxWidth: 120,
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
      fontSize: 20,
      fontFamily: "NotoSerif_700Bold",
    },
    labelLatin: {
      color: colors.onPrimary,
      fontSize: 16,
      paddingTop: 5,
      fontFamily: "NotoSerif_400Regular_Italic",
    }
  });
}
