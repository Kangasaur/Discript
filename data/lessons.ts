import type { Entry, Lesson, ScriptMeta } from "@/types/data";
import { devWarn } from "@/utils/devWarn";
import cyrillicMeta from "./cyrillic/meta.json";
import cyrillicLesson01 from "./cyrillic/lesson-01.json";
interface ScriptLessonData {
  meta: ScriptMeta;
  /** keyed by the ids listed in meta.lessons */
  lessons: Record<string, Lesson>;
}
// ── Add new lessons / scripts here ────────────────────────────────────────────
const SCRIPT_LESSON_DATA: Record<string, ScriptLessonData> = {
  cyrillic: {
    meta: cyrillicMeta as unknown as ScriptMeta,
    lessons: {
      "lesson-01": cyrillicLesson01 as unknown as Lesson,
    },
  },
};
// ─────────────────────────────────────────────────────────────────────────────
const stripExtension = (id: string) => id.replace(/\.json$/i, "");
export function getScriptIds(): string[] {
  return Object.keys(SCRIPT_LESSON_DATA);
}
export function getScriptMeta(scriptId: string): ScriptMeta | undefined {
  return SCRIPT_LESSON_DATA[scriptId]?.meta;
}
/** Lessons for a script, ordered by meta.lessons. */
export function getLessons(scriptId: string): Lesson[] {
  const data = SCRIPT_LESSON_DATA[scriptId];
  if (!data) {
    devWarn(`[lessons] unknown script "${scriptId}"`);
    return [];
  }
  const ids = data.meta.lessons //data.meta?.lessons?.length ? data.meta.lessons : Object.keys(data.lessons);
  const lessons: Lesson[] = [];
  for (const id of ids) {
    const lesson = data.lessons[id.id] ?? data.lessons[stripExtension(id.id)];
    if (lesson) lessons.push(lesson);
    else devWarn(`[lessons] ${scriptId}: "${id}" is listed in meta.json but not imported in data/lessons.ts`);
  }
  return lessons;
}
export function getLesson(scriptId: string, lessonId: string): Lesson | undefined {
  const lessons = SCRIPT_LESSON_DATA[scriptId]?.lessons;
  return lessons?.[lessonId] ?? lessons?.[stripExtension(lessonId)];
}
/** Every entry of every lesson, in lesson order. */
export function getEntries(scriptId: string): Entry[] {
  return getLessons(scriptId).flatMap((lesson) => lesson.entries ?? []);
}