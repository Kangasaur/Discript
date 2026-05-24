import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
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

  const player = entry.audioFile ? useAudioPlayer(cyrillicAudio[entry.audioFile]) : null;

  function playSound() {
    if (player) {
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
