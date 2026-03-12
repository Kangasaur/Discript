# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start            # Start Expo dev server (scan QR code or open in emulator)
npm run android      # Start with Android emulator
npm run ios          # Start with iOS simulator
npm run web          # Start web version
npm run lint         # Run ESLint via expo lint
npm run reset-project  # Move app/ to app-example/ and create fresh app/
```

There is no test runner configured yet.

## Project Overview

**Discript** is a web app that provides learners of non-Latin scripts with customizable quizzes. Scripts are broken up into one or more "lessons", each with their own quizzes and reference sheets giving Latin transcriptions and sometimes audio for pronunciation.

## Architecture

**Discript** is an Expo (SDK 54) React Native app targeting Android, iOS, and web.

- **Routing**: File-based routing via `expo-router`. The `app/` directory is the entire route tree. `app/_layout.tsx` defines the root navigator; `app/index.tsx` is the home screen.
- **Path alias**: `@/` maps to the repo root (e.g., `@/components/Foo` resolves to `./components/Foo`).
- **New Architecture**: Enabled (`newArchEnabled: true`). React Compiler experiment is also enabled.
- **TypeScript**: Strict mode. Config extends `expo/tsconfig.base`.
- **Typed routes**: `experiments.typedRoutes` is enabled — route strings are type-checked by expo-router.

Key installed but not yet wired up: `@react-navigation/bottom-tabs`, `expo-haptics`, `expo-image`, `react-native-reanimated`, `react-native-gesture-handler`.

## Workflows
Before any modifications that change the architecture of the project or implement a new feature:
- ask clarifying questions to gain a clear idea of what is expected
- create a plan for implementation
- suggest possible tests for validation