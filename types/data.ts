export interface ScriptMeta {
  id: string;
  name: string;
  lessons: string[];
}

export interface ScriptColors {
  background: string;
  primary: string;
  accent: string;
  accentPressed: string;
  muted: string;
  onPrimary: string;
}

export interface Script {
  id: string;
  name: string;
  icon: string;
  colors: ScriptColors;
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
