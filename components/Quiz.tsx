import { useState, useEffect, useMemo, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import { useScriptTheme } from "@/contexts/ScriptTheme";
import type { Entry, Lesson, ScriptColors } from "@/types/data";

interface Props {
  lesson: Lesson;
  questionCount: number;
  onExit: () => void;
}

type QuizStatus = "answering" | "correct" | "incorrect" | "done";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Build a queue of exactly `count` entries, reshuffling when exhausted.
// Avoids placing the same entry twice in a row across reshuffle boundaries.
function buildQueue(entries: Entry[], count: number): Entry[] {
  const queue: Entry[] = [];
  let pool = shuffle(entries);
  while (queue.length < count) {
    if (pool.length === 0) {
      pool = shuffle(entries);
      // Avoid immediate repeat at reshuffle boundary
      if (
        queue.length > 0 &&
        pool.length > 1 &&
        pool[0].character === queue[queue.length - 1].character
      ) {
        const swap = Math.floor(Math.random() * (pool.length - 1)) + 1;
        [pool[0], pool[swap]] = [pool[swap], pool[0]];
      }
    }
    queue.push(pool.shift()!);
  }
  return queue;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function Quiz({ lesson, questionCount, onExit }: Props) {
  const { colors } = useScriptTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [queue] = useState(() => buildQueue(lesson.entries, questionCount));
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<QuizStatus>("answering");
  const [score, setScore] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const current = queue[index];
  const total = queue.length;

  function markDone() {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus("done");
  }

  function advance(fromIndex: number) {
    if (fromIndex + 1 >= total) {
      markDone();
    } else {
      setIndex(fromIndex + 1);
      setInput("");
      setStatus("answering");
      inputRef.current?.focus();
    }
  }

  function submit() {
    if (status !== "answering" || !input.trim()) return;
    const isCorrect =
      input.trim().toLowerCase() === current.latin.toLowerCase();
    if (isCorrect) {
      setScore((s) => s + 1);
      setStatus("correct");
    } else {
      setStatus("incorrect");
    }
  }

  if (status === "done") {
    return (
      <View style={[styles.outer, styles.container]}>
        <Text style={styles.doneTitle}>Quiz Complete!</Text>
        <Text style={styles.doneStat}>
          {score} / {total} correct
        </Text>
        <Text style={styles.doneStat}>{formatTime(elapsed)}</Text>
        <Pressable style={[styles.button, styles.buttonExit]} onPress={onExit}>
          <Text style={styles.buttonText}>Exit</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.outer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {index + 1} / {total}
        </Text>
        <Text style={styles.headerText}>{formatTime(elapsed)}</Text>
      </View>

      <Text style={styles.character}>{current.character}</Text>
      <Text style={styles.inputHint}>What sound does this make?</Text>
      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          status === "correct" && styles.inputCorrect,
          status === "incorrect" && styles.inputIncorrect,
        ]}
        value={input}
        onChangeText={setInput}
        onSubmitEditing={submit}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        editable={status === "answering"}
        returnKeyType="done"
      />

      {status === "correct" && (
        <Text style={styles.feedbackCorrect}>Correct!</Text>
      )}
      {status === "incorrect" && (
        <Text style={styles.feedbackIncorrect}>
          Correct answer: {current.latin}
        </Text>
      )}

      {status === "answering" && (
        <Pressable style={styles.button} onPress={submit}>
          <Text style={styles.buttonText}>Submit</Text>
        </Pressable>
      )}
      {(status === "incorrect" || status === "correct") && (
        <Pressable style={styles.button} onPress={() => advance(index)}>
          <Text style={styles.buttonText}>Next</Text>
        </Pressable>
      )}

      <Pressable style={styles.exitButton} onPress={onExit}>
        <Text style={styles.exitButtonText}>Exit</Text>
      </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ScriptColors) {
  return StyleSheet.create({
    outer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    header: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 24,
    },
    headerText: {
      fontSize: 15,
      fontFamily: "NotoSerif_600SemiBold",
      color: colors.muted,
    },
    character: {
      fontSize: 80,
      fontFamily: "NotoSerif_400Regular",
      marginBottom: 40,
      lineHeight: 120,
      color: colors.onPrimary,
    },
    input: {
      width: "100%",
      maxWidth: 280,
      borderWidth: 3,
      borderColor: colors.accent,
      backgroundColor: "#ffffff",
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: 22,
      fontFamily: "NotoSerif_400Regular",
      textAlign: "center",
      marginBottom: 20,
      color: "#111",
    },
    inputCorrect: {
      borderColor: "#22c55e",
    },
    inputIncorrect: {
      borderColor: "#ef4444",
    },
    inputHint: {
      fontSize: 14,
      fontFamily: "NotoSerif_300Light_Italic",
      color: colors.accent,
      marginTop: -14,
      marginBottom: 8,
    },
    feedbackCorrect: {
      fontSize: 20,
      color: "#22c55e",
      fontFamily: "NotoSerif_600SemiBold",
      marginBottom: 20,
    },
    feedbackIncorrect: {
      fontSize: 18,
      color: "#ef4444",
      fontFamily: "NotoSerif_600SemiBold",
      marginBottom: 20,
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 40,
      paddingVertical: 14,
      borderRadius: 10,
    },
    buttonExit: {
      marginTop: 32,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: 18,
      fontFamily: "NotoSerif_600SemiBold",
    },
    exitButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      marginTop: 16,
    },
    exitButtonText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontFamily: "NotoSerif_400Regular",
    },
    doneTitle: {
      fontSize: 36,
      fontFamily: "NotoSerif_700Bold",
      marginBottom: 20,
      color: colors.onPrimary,
    },
    doneStat: {
      fontSize: 22,
      fontFamily: "NotoSerif_400Regular",
      color: colors.accent,
      marginBottom: 10,
    },
  });
}
