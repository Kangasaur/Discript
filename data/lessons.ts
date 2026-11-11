import type { Entry, Lesson, ScriptMeta } from "@/types/data";
import { devWarn } from "@/utils/devWarn";
import cyrillicMeta from "./cyrillic/meta.json";

interface ScriptLessonData {
  meta: ScriptMeta;
  /** keyed by the ids listed in meta.lessons */
  lessons: Record<string, () => Promise<{ default: Lesson }>>;
}

// ── Add new lessons / scripts here ────────────────────────────────────────────
const SCRIPT_LESSON_LOADERS: Record<string, ScriptLessonData> = {
  cyrillic: {
    meta: cyrillicMeta as unknown as ScriptMeta,
    lessons: {
      "lesson-01": () => import("@/data/cyrillic/lesson-01.json"),
    },
  },
};
// ─────────────────────────────────────────────────────────────────────────────
const stripExtension = (id: string) => id.replace(/\.json$/i, "");
export function getScriptIds(): string[] {
  return Object.keys(SCRIPT_LESSON_LOADERS);
}
export function getScriptMeta(scriptId: string): ScriptMeta | undefined {
  return SCRIPT_LESSON_LOADERS[scriptId]?.meta;
}
/** Loads all lessons for a script, ordered by a flattened meta.lessons. */
export async function getLessons(scriptId: string): Promise<Lesson[]> {
  const data = SCRIPT_LESSON_LOADERS[scriptId];
  if (!data) {
    devWarn(`[lessons] unknown script "${scriptId}"`);
    return [];
  }
  const ids = data.meta.lessons
  const lessons: Lesson[] = [];
  for (const id of ids) {
    const lesson = await getLesson(scriptId, id.id)
    if (lesson) lessons.push(lesson.default as Lesson);
    else devWarn(`[lessons] ${scriptId}: "${id}" is listed in meta.json but not imported in data/lessons.ts`);
  }
  return lessons;
}
export async function getLesson(scriptId: string, lessonId: string): Promise<{default: Lesson}>{
  const lessons = SCRIPT_LESSON_LOADERS[scriptId]?.lessons;
  const loader = lessons[lessonId];
  const lesson = await loader();
  return lesson;
}
/** Every entry of every lesson, in lesson order. */
export async function getEntries(scriptId: string): Promise<Entry[]> {
  const lessons = await getLessons(scriptId);
  return lessons.flatMap((lesson) => lesson.entries ?? []);
}