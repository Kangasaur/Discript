import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScriptThemeProvider } from "@/contexts/ScriptTheme";
import QuizOptions from "@/components/QuizOptions";
import { DEFAULT_COUNT, MAX_COUNT } from "@/utils/quizOptions";
import type { Lesson } from "@/types/data";

// QuizOptions renders CharacterRefButton, which pulls in audio assets.
vi.mock("expo-audio", () => ({ useAudioPlayer: () => ({ seekTo: vi.fn(), play: vi.fn() }) }));
vi.mock("@/data/cyrillic/audio", () => ({
  cyrillicAudio: new Proxy({}, { get: () => 1 }),
}));

const lesson: Lesson = {
  id: "lesson-01",
  title: "Test Lesson",
  lessonType: "standard",
  entries: [
    { character: "а", latin: "a" },
    { character: "б", latin: "b" },
    { character: "в", latin: "v" },
  ],
};

function renderOptions(overrides: Partial<React.ComponentProps<typeof QuizOptions>> = {}) {
  const props = {
    lesson,
    onStart: vi.fn(),
    onBack: vi.fn(),
    ...overrides,
  };
  render(
    <ScriptThemeProvider scriptId="cyrillic">
      <QuizOptions {...props} />
    </ScriptThemeProvider>,
  );
  return props;
}

describe("QuizOptions", () => {
  it("renders the title and character count", () => {
    renderOptions();
    expect(screen.getByText("Test Lesson")).toBeInTheDocument();
    expect(screen.getByText("3 characters")).toBeInTheDocument();
  });

  it("defaults the question count to DEFAULT_COUNT", () => {
    renderOptions();
    expect(screen.getByDisplayValue(String(DEFAULT_COUNT))).toBeInTheDocument();
  });

  it("starts the quiz with the current count", () => {
    const { onStart } = renderOptions();
    fireEvent.click(screen.getByText("Start Quiz"));
    expect(onStart).toHaveBeenCalledWith(DEFAULT_COUNT);
  });

  it("increments and decrements the count via the steppers", () => {
    const { onStart } = renderOptions();
    fireEvent.click(screen.getByText("+"));
    fireEvent.click(screen.getByText("+"));
    fireEvent.click(screen.getByText("−"));
    fireEvent.click(screen.getByText("Start Quiz"));
    expect(onStart).toHaveBeenCalledWith(DEFAULT_COUNT + 1);
  });

  it("clamps typed input to the valid range", () => {
    const { onStart } = renderOptions();
    const field = screen.getByDisplayValue(String(DEFAULT_COUNT));
    fireEvent.change(field, { target: { value: "5000" } });
    fireEvent.click(screen.getByText("Start Quiz"));
    expect(onStart).toHaveBeenCalledWith(MAX_COUNT);
  });

  it("calls onBack when Back is pressed", () => {
    const { onBack } = renderOptions();
    fireEvent.click(screen.getByText("Back"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders a reference button per entry", () => {
    renderOptions();
    expect(screen.getByText("а")).toBeInTheDocument();
    expect(screen.getByText("б")).toBeInTheDocument();
    expect(screen.getByText("в")).toBeInTheDocument();
  });
});
