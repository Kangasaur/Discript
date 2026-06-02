# Discript

Discript is a cross-platform app for learning non-Latin scripts. Each script is broken into ordered lessons, and each lesson is backed by a customizable quiz over its characters. The first supported script is Cyrillic; the data model is script-agnostic so additional scripts can be added without code changes.

## How it works

A **script** (e.g. Cyrillic) contains an ordered list of **lessons**. A lesson holds **entries** — one per character — pairing the glyph with its Latin transcription and, optionally, a reference note and an audio file. Quizzes are generated from lesson entries; quiz options (direction, length, etc.) are configurable per session.

Per-script theming is applied at the route layout level, so navigating into a script swaps the color palette globally for that subtree.

## Stack

- **Expo SDK 54** / **React Native 0.81** / **React 19**, targeting iOS, Android, and web
- **expo-router 6** with file-based routing and typed routes
- **TypeScript** in strict mode
- **expo-audio** for character pronunciation playback
- **@react-navigation** (native, drawer, bottom-tabs, elements) wired through expo-router

## Project layout

```
app/                  expo-router route tree
  _layout.tsx         root navigator
  index.tsx           script picker (home)
  cyrillic/           per-script subtree (layout + lessons)
components/           CharacterRefButton, LessonButton, Quiz, QuizOptions
contexts/
  ScriptTheme.tsx     script-scoped color context
data/
  scripts.json        registry of available scripts + theme colors
  <script-id>/
    meta.json         script metadata, lesson id list
    lesson-XX.json    lesson contents (entries)
    audio.ts          static audio asset map
types/data.ts         Script / Lesson / Entry interfaces
```

The `@/` path alias maps to the repo root (e.g. `@/components/Quiz`).

## Data model

Defined in `types/data.ts`:

- `Script` — id, display name, icon glyph, and a `ScriptColors` palette
- `ScriptMeta` — script id, name, and ordered list of lesson ids
- `Lesson` — id, title, `lessonType` (currently `"standard"`), and an array of `Entry`
- `Entry` — `character`, `latin`, optional `reference` and `audioFile`

Lessons are loaded lazily via dynamic `import()` so only the active lesson is held in memory. `ScriptThemeProvider` reads from `data/scripts.json` and exposes the active script's palette via the `useScriptTheme()` hook.

## Getting started

```bash
npm install
npm start            # Expo dev server
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run web          # web build
npm run lint         # expo lint (ESLint)
```

No test runner is configured yet.

## Adding a script

1. Add an entry to `data/scripts.json` with an id, display name, icon glyph, and color palette.
2. Create `data/<script-id>/meta.json` listing the lesson ids in order.
3. Add `data/<script-id>/lesson-XX.json` files matching the `Lesson` shape.
4. Create `app/<script-id>/` with a `_layout.tsx` that wraps children in `ScriptThemeProvider`, plus the screens for the script.

## Roadmap

- **Reference sheets** for each lesson, including high-quality audio for each character, pronunciation guides, and stroke diagrams for writing.
- **Explore mode**: a digital keyboard for each character that plays the sound and shows the romanization when pressed.
- **Local persistence** of user data — lesson completion and fastest quiz scores stored on-device.
- **Lesson partitioning**: when a user takes a quiz in a lesson they haven't learned yet, the lesson is split into discrete "sublessons" of up to 5 characters each.
- **Writing mode**: capture handwriting input and grade it against the target character using online HTR.
- **Optional accounts** for securely syncing user data between devices.
