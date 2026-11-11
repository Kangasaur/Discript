import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ScriptThemeProvider } from "@/contexts/ScriptTheme";
import CharacterRefButton from "@/components/CharacterRefButton";
import type { Entry } from "@/types/data";

const player = { seekTo: vi.fn(() => Promise.resolve()), play: vi.fn() };
vi.mock("expo-audio", () => ({
  useAudioPlayer: () => player,
}));

// The real audio module require()s .wav assets that don't exist under vitest.
vi.mock("@/data/cyrillic/audio", () => ({
  cyrillicAudio: new Proxy({}, { get: () => 1 }),
}));

function renderButton(entry: Entry, onPress?: () => void) {
  return render(
    <ScriptThemeProvider scriptId="cyrillic">
      <CharacterRefButton entry={entry} onPress={onPress} />
    </ScriptThemeProvider>,
  );
}

beforeEach(() => {
  player.seekTo.mockClear();
  player.play.mockClear();
});

describe("CharacterRefButton", () => {
  it("shows the reference label when present", () => {
    renderButton({ character: "а", key: "a", latin: "a", reference: "Аа" });
    expect(screen.getByText("Аа")).toBeInTheDocument();
  });

  it("falls back to the character when there is no reference", () => {
    renderButton({ character: "ж", key: "zh", latin: "zh" });
    expect(screen.getByText("ж")).toBeInTheDocument();
  });

  it("plays the audio from the start when pressed", async () => {
    renderButton({ character: "а", key: "a", latin: "a", audioFile: "lesson-01/a" });
    fireEvent.click(screen.getByText("а"));
    expect(player.seekTo).toHaveBeenCalledWith(0);
    await waitFor(() => expect(player.play).toHaveBeenCalledTimes(1));
  });

  it("waits for the seek to finish before playing", async () => {
    let finishSeek!: () => void;
    player.seekTo.mockImplementationOnce(() => new Promise<void>((r) => (finishSeek = r)));
    renderButton({ character: "а", key: "a", latin: "a", audioFile: "lesson-01/a" });
    fireEvent.click(screen.getByText("а"));
    await Promise.resolve();
    expect(player.play).not.toHaveBeenCalled();
    finishSeek();
    await waitFor(() => expect(player.play).toHaveBeenCalledTimes(1));
  });

  it("does nothing when the entry has no audio", () => {
    renderButton({ character: "ж", key: "zh", latin: "zh" });
    fireEvent.click(screen.getByText("ж"));
    expect(player.seekTo).not.toHaveBeenCalled();
    expect(player.play).not.toHaveBeenCalled();
  });

  it("invokes a provided onPress instead of playing audio", () => {
    const onPress = vi.fn();
    renderButton({ character: "а", key: "a", latin: "a", audioFile: "lesson-01/a" }, onPress);
    fireEvent.click(screen.getByText("а"));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(player.play).not.toHaveBeenCalled();
  });
});
