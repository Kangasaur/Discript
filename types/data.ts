export interface ScriptMeta {
  id: string;
  name: string;
  lessons: string[];
}

export type LessonType = "standard" | (string & {});

export interface Entry {
  character: string;
  latin: string;
  reference?: string;
  audioFile?: string;
}

export interface Lesson {
  id: string;
  title: string;
  lessonType: LessonType;
  entries: Entry[];
}
