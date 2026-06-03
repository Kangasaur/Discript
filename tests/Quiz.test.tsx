import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScriptThemeProvider } from "@/contexts/ScriptTheme";
import Quiz from "@/components/Quiz";
import type { Lesson } from "@/types/data";

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

function latinOf(): string {
  // Find which character is currently on screen and return its expected answer.
  for (const e of lesson.entries) {
    if (screen.queryByText(e.character)) return e.latin;
  }
  throw new Error("no quiz character visible");
}

function typeAndSubmit(value: string) {
  fireEvent.change(screen.getByRole("textbox"), { target: { value } });
  fireEvent.click(screen.getByText("Submit"));
}

// Answer the current question either correctly or incorrectly, then advance.
function answer(correct: boolean) {
  const expected = latinOf();
  typeAndSubmit(correct ? expected : `${expected}-wrong`);
  fireEvent.click(screen.getByText("Next"));
}

function renderQuiz(questionCount: number, onExit = vi.fn()) {
  render(
    <ScriptThemeProvider scriptId="cyrillic">
      <Quiz lesson={lesson} questionCount={questionCount} onExit={onExit} />
    </ScriptThemeProvider>,
  );
  return { onExit };
}

describe("Quiz", () => {
  it("shows the first question with progress and prompt", () => {
    renderQuiz(3);
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.getByText("What sound does this make?")).toBeInTheDocument();
  });

  it("shows positive feedback and a Next button for a correct answer", () => {
    renderQuiz(3);
    typeAndSubmit(latinOf());
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.queryByText("Submit")).not.toBeInTheDocument();
  });

  it("reveals the correct answer for a wrong answer", () => {
    renderQuiz(3);
    const expected = latinOf();
    typeAndSubmit("definitely-wrong");
    expect(screen.getByText(`Correct answer: ${expected}`)).toBeInTheDocument();
  });

  it("ignores submission of an empty answer", () => {
    renderQuiz(3);
    fireEvent.click(screen.getByText("Submit"));
    expect(screen.queryByText("Correct!")).not.toBeInTheDocument();
    expect(screen.getByText("Submit")).toBeInTheDocument();
  });

  it("matches answers case-insensitively and trims whitespace", () => {
    renderQuiz(3);
    typeAndSubmit(`  ${latinOf().toUpperCase()}  `);
    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });

  it("advances through questions and finishes with a full score", () => {
    renderQuiz(2);
    answer(true);
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    answer(true);
    expect(screen.getByText("Quiz Complete!")).toBeInTheDocument();
    expect(screen.getByText("2 / 2 correct")).toBeInTheDocument();
  });

  it("only counts correct answers in the final score", () => {
    renderQuiz(2);
    answer(true);
    answer(false);
    expect(screen.getByText("1 / 2 correct")).toBeInTheDocument();
  });

  it("calls onExit from the completion screen", () => {
    const { onExit } = renderQuiz(1);
    answer(true);
    fireEvent.click(screen.getByText("Exit"));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("calls onExit from the Exit button mid-quiz", () => {
    const { onExit } = renderQuiz(3);
    fireEvent.click(screen.getByText("Exit"));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
