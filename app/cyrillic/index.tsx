import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import LessonButton from "@/components/LessonButton";
import Quiz from "@/components/Quiz";
import QuizOptions from "@/components/QuizOptions";
import { useScriptTheme } from "@/contexts/ScriptTheme";
import type { Lesson, ScriptColors } from "@/types/data";
import cyrillicMeta from "@/data/cyrillic/meta.json";
import CharacterReferenceSheet from "@/components/CharacterReferenceSheet";

// Metro requires statically-analyzable import paths, so all lesson files
// must be enumerated explicitly here.
const LESSON_LOADERS: Record<string, () => Promise<{ default: Lesson }>> = {
  "cyrillic/lesson-01": () => import("@/data/cyrillic/lesson-01.json"),
};

type Screen = "menu" | "options" | "quiz";

export default function CyrillicIndex() {
  const { colors } = useScriptTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [screen, setScreen] = useState<Screen>("menu");
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [questionCount, setQuestionCount] = useState(20);
  const [loadingLesson, setLoadingLesson] = useState<string | null>(null);

  async function openOptions(scriptId: string, lessonId: string) {
    const loader = LESSON_LOADERS[`${scriptId}/${lessonId}`];
    if (!loader) return;
    setLoadingLesson(lessonId);
    const module = await loader();
    setActiveLesson(module.default as Lesson);
    setLoadingLesson(null);
    setScreen("options");
  }

  function startQuiz(count: number) {
    setQuestionCount(count);
    setScreen("quiz");
  }

  function exitToMenu() {
    setScreen("menu");
    setActiveLesson(null);
  }

  if (screen === "options" && activeLesson) {
    return (
      <QuizOptions
        lesson={activeLesson}
        onStart={startQuiz}
        onBack={exitToMenu}
      />
    );
  }

  if (screen === "quiz" && activeLesson) {
    return (
      <Quiz
        lesson={activeLesson}
        questionCount={questionCount}
        onExit={exitToMenu}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{cyrillicMeta.name}</Text>
      {cyrillicMeta.lessons.map((lessonId) => (
        <LessonButton
          key={lessonId.id}
          label={lessonId.name}
          loading={loadingLesson === lessonId.id}
          onPress={() => openOptions(cyrillicMeta.id, lessonId.id)}
        />
      ))}
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
      fontSize: 34,
      fontFamily: "NotoSerif_700Bold",
      marginBottom: 32,
      color: colors.onPrimary,
    },
  });
}
