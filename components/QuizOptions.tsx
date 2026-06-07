import { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Modal from "react-native-modal";
import { useScriptTheme } from "@/contexts/ScriptTheme";
import type { Lesson, ScriptColors } from "@/types/data";
import { DEFAULT_COUNT, clamp } from "@/utils/quizOptions";
import CharacterReferenceSheet from "./CharacterReferenceSheet";

const HOLD_DELAY = 200;
const HOLD_INTERVAL = 80;

interface Props {
  lesson: Lesson;
  onStart: (questionCount: number) => void;
  onBack: () => void;
}

export default function QuizOptions({ lesson, onStart, onBack }: Props) {
  const { colors } = useScriptTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [count, setCount] = useState(DEFAULT_COUNT);
  const [refVisible, setRefVisible] = useState(false);
  // Text field value kept as string so the user can clear and retype freely
  const [inputValue, setInputValue] = useState(String(DEFAULT_COUNT));
  const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  function applyDelta(delta: number) {
    setCount((c) => {
      const next = clamp(c + delta);
      setInputValue(String(next));
      return next;
    });
  }

  function startHold(delta: number) {
    holdTimeout.current = setTimeout(() => {
      holdInterval.current = setInterval(() => applyDelta(delta), HOLD_INTERVAL);
    }, HOLD_DELAY);
  }

  function stopHold() {
    if (holdTimeout.current) clearTimeout(holdTimeout.current);
    if (holdInterval.current) clearInterval(holdInterval.current);
  }

  function handleInputChange(text: string) {
    // Allow empty string while typing
    setInputValue(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed)) {
      setCount(clamp(parsed));
    }
  }

  function handleInputBlur() {
    // Snap display value to the clamped count when the field loses focus
    setInputValue(String(count));
  }

  return (
    <View style={styles.container}>
      <Modal
        isVisible={refVisible}
        backdropOpacity={0.8}
        onBackdropPress={() => setRefVisible(false)}
        style={{marginHorizontal: 0, justifyContent: "flex-start"}}
        >
        <View style={styles.modalHeader}>
          <Pressable style={styles.backButton} onPress={() => {setRefVisible(false)}}>
            <Text style={styles.backButtonText}>Close</Text>
          </Pressable>
        </View>
        <View style={styles.modalBody}>
          <CharacterReferenceSheet lesson={lesson}/>
        </View>
      </Modal>
      <View style={styles.footer}>
        <Pressable style={styles.startButton} onPress={() => {setRefVisible(true);}}>
          <Text style={styles.backButtonText}>View Reference</Text>
        </Pressable>
      </View>
      <Text style={styles.title}>{lesson.title}</Text>
      <Text style={styles.subtitle}>{lesson.entries.length} characters</Text>

      <View style={styles.optionBlock}>
        <Text style={styles.optionLabel}>Questions</Text>
        <View style={styles.stepper}>
          <Pressable
            style={({ pressed }) => [
              styles.stepButton,
              pressed && styles.stepButtonPressed,
            ]}
            onPress={() => applyDelta(-1)}
            onPressIn={() => startHold(-1)}
            onPressOut={stopHold}
          >
            <Text style={styles.stepButtonText}>−</Text>
          </Pressable>

          <TextInput
            style={styles.stepValue}
            value={inputValue}
            onChangeText={handleInputChange}
            onBlur={handleInputBlur}
            keyboardType="number-pad"
            selectTextOnFocus
            maxLength={3}
            returnKeyType="done"
          />

          <Pressable
            style={({ pressed }) => [
              styles.stepButton,
              pressed && styles.stepButtonPressed,
            ]}
            onPress={() => applyDelta(1)}
            onPressIn={() => startHold(1)}
            onPressOut={stopHold}
          >
            <Text style={styles.stepButtonText}>+</Text>
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.startButton} onPress={() => onStart(count)}>
        <Text style={styles.startButtonText}>Start Quiz</Text>
      </Pressable>

      <Pressable style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: ScriptColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 28,
      fontFamily: "NotoSerif_700Bold",
      color: colors.onPrimary,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 15,
      fontFamily: "NotoSerif_300Light",
      color: colors.onPrimary,
      marginBottom: 48,
    },
    optionBlock: {
      alignItems: "center",
      marginBottom: 48,
    },
    optionLabel: {
      fontSize: 16,
      fontFamily: "NotoSerif_600SemiBold",
      color: colors.accent,
      fontWeight: "600",
      marginBottom: 16,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    stepper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 20,
    },
    stepButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    stepButtonPressed: {
      backgroundColor: colors.accentPressed,
    },
    stepButtonText: {
      fontSize: 24,
      color: colors.onPrimary,
      lineHeight: 28,
    },
    stepValue: {
      fontSize: 40,
      fontFamily: "NotoSerif_700Bold",
      color: colors.onPrimary,
      minWidth: 70,
      maxWidth: 110,
      textAlign: "center",
    },
    startButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 48,
      paddingVertical: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    startButtonText: {
      color: colors.onPrimary,
      fontSize: 18,
      fontFamily: "NotoSerif_700Bold",
    },
    backButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    backButtonText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontFamily: "NotoSerif_400Regular",
    },
    modalBackground: {
      backgroundColor: "#000000c0",
      flex: 1,
    },
    modalHeader: {
      flexDirection:"row-reverse",
      paddingTop: 20,
    },
    modalBody: {
      maxWidth: 900,
      justifyContent: "center",
      alignSelf: "center",
      paddingBottom: 20,
    },
    footer: {
      position: "absolute",
      bottom: 10,
      left: 0,
      right: 0,
      alignItems: "center",
    }
  });
}
