import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import AppButton from "@/components/ui/AppButton";
import SegmentedControl, { type SegmentedOption } from "@/components/ui/SegmentedControl";
import ToggleRow from "@/components/ui/ToggleRow";
import CharacterPicker from "@/components/writing/CharacterPicker";
import DrawingCanvas from "@/components/writing/DrawingCanvas";
import WritingPrompt from "@/components/writing/WritingPrompt";
import { getAllScripts } from "@/contexts/ScriptTheme";
import { availableCases, getHandwritingScript, getHandwritingScripts, glyphFor } from "@/data/handwriting";
import appTheme from "@/data/app.json";
import type { AppTheme, ScriptColors } from "@/types/data";
import type { InkStroke, LetterCase, SampleLabel } from "@/types/handwriting";
import { buildSample, countsByLabel, labelId } from "@/utils/handwritingSamples";
import { deleteAllSamples, exportSamples, listSampleIds, saveSample } from "@/utils/handwritingStorage";
// Used when a handwriting script has no matching entry in scripts.json.
const themeColors = (appTheme as AppTheme).colors;
const FALLBACK_COLORS: ScriptColors = {
  background: themeColors.background,
  primary: themeColors.primary,
  accent: themeColors.cardBorder,
  accentPressed: themeColors.textMuted,
  muted: themeColors.textMuted,
  onPrimary: themeColors.onPrimary,
};
const DIAGRAM_OPACITY = 0.3;
type Status = { kind: "ok" | "error"; text: string } | null;
function notify(title: string, message: string) {
  if (Platform.OS === "web") {
    (globalThis as any).alert?.(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
function confirmDestructive(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    if ((globalThis as any).confirm?.(message)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: onConfirm },
  ]);
}
export default function HandwritingCollectionScreen() {
  const scripts = useMemo(() => getHandwritingScripts(), []);
  const [scriptId, setScriptId] = useState(scripts[0]?.id ?? "");
  const script = scripts.find((s) => s.id === scriptId) ?? scripts[0];
  const characters = script?.characters ?? [];
  const [characterKey, setCharacterKey] = useState(characters[0]?.key ?? "");
  const character = characters.find((c) => c.key === characterKey) ?? characters[0];
  const cases = useMemo(() => (character ? availableCases(character) : []), [character]);
  const [preferredCase, setPreferredCase] = useState<LetterCase>("upper");
  // Derived, so characters with a single diagram can never land in a bad state.
  const letterCase: LetterCase = cases.includes(preferredCase) ? preferredCase : (cases[0] ?? "lower");
  const [strokes, setStrokes] = useState<InkStroke[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [drawing, setDrawing] = useState(false);
  const [showDiagram, setShowDiagram] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [sessionCount, setSessionCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const colors = useMemo(
    () => getAllScripts().find((s) => s.id === scriptId)?.colors ?? FALLBACK_COLORS,
    [scriptId],
  );
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const label: SampleLabel | null = useMemo(() => {
    if (!script || !character) return null;
    return {
      script: script.id,
      key: character.key,
      latin: character.latin,
      case: letterCase,
      character: glyphFor(character, letterCase),
    };
  }, [script, character, letterCase]);
  const storedTotal = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);
  const labelCount = label ? (counts[labelId(label)] ?? 0) : 0;
  const hasInk = strokes.length > 0;
  const refreshCounts = useCallback(async () => {
    try {
      setCounts(countsByLabel(await listSampleIds()));
    } catch (error) {
      setStatus({ kind: "error", text: (error as Error).message });
    }
  }, []);
  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);
  useEffect(() => {
    if (status?.kind !== "ok") return;
    const timer = setTimeout(() => setStatus(null), 2500);
    return () => clearTimeout(timer);
  }, [status]);
  const resetCanvas = useCallback(() => {
    setStrokes([]);
    setStatus(null);
  }, []);
  const handleScriptChange = useCallback(
    (id: string) => {
      setScriptId(id);
      setCharacterKey(getHandwritingScript(id)?.characters[0]?.key ?? "");
      resetCanvas();
    },
    [resetCanvas],
  );
  const handleSubmit = useCallback(async () => {
    if (!label || !hasInk || saving || canvasSize.width === 0) return;
    setSaving(true);
    try {
      const sample = buildSample({ label, diaOn: showDiagram, strokes, canvas: canvasSize });
      await saveSample(sample);
      setCounts((prev) => ({ ...prev, [labelId(label)]: (prev[labelId(label)] ?? 0) + 1 }));
      setSessionCount((n) => n + 1);
      setStrokes([]);
      setStatus({
        kind: "ok",
        text:
          `Saved ${sample.label.character ?? sample.label.latin} — ` +
          `${sample.stats.strokeCount} strokes, ${sample.stats.pointCount} points ` +
          `→ ${sample.stats.featurePointCount} resampled`,
      });
    } catch (error) {
      setStatus({ kind: "error", text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  }, [label, hasInk, saving, canvasSize, strokes]);
  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const result = await exportSamples();
      notify(
        "Export complete",
        result.shared
          ? `${result.count} samples exported as ${result.fileName}.`
          : `${result.count} samples written to:\n${result.uri}`,
      );
    } catch (error) {
      notify("Export failed", (error as Error).message);
    } finally {
      setExporting(false);
    }
  }, []);
  const handleDeleteAll = useCallback(() => {
    confirmDestructive(
      "Delete samples",
      `Delete all ${storedTotal} stored samples? This cannot be undone.`,
      () => {
        void (async () => {
          try {
            await deleteAllSamples();
            setCounts({});
            setSessionCount(0);
            setStatus({ kind: "ok", text: "Stored samples deleted" });
          } catch (error) {
            setStatus({ kind: "error", text: (error as Error).message });
          }
        })();
      },
    );
  }, [storedTotal]);
  const scriptOptions: SegmentedOption<string>[] = scripts.map((s) => ({ value: s.id, label: s.name }));
  const caseOptions = (
    [
      { value: "upper", label: "Uppercase" },
      { value: "lower", label: "Lowercase" },
    ] as SegmentedOption<LetterCase>[]
  ).filter((option) => cases.includes(option.value));
  const diagramSource = character?.diagrams[letterCase];
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} scrollEnabled={!drawing} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.heading}>Handwriting data collection</Text>
          <Text style={styles.subheading}>Samples are labelled automatically from the selection below.</Text>
        </View>
        {scriptOptions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No handwriting scripts configured</Text>
            <Text style={styles.emptyText}>
              {"Register a ScriptDiagramSet in data/handwriting/index.ts and import its lessons in data/lessons.ts."}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Script</Text>
              <SegmentedControl
                options={scriptOptions}
                value={script?.id ?? ""}
                colors={colors}
                onChange={handleScriptChange}
              />
            </View>
            {character ? (
              <>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Character</Text>
                  <CharacterPicker
                    characters={characters}
                    value={character.key}
                    letterCase={letterCase}
                    colors={colors}
                    onChange={(key) => {
                      setCharacterKey(key);
                      resetCanvas();
                    }}
                  />
                </View>
                {caseOptions.length > 1 ? (
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>Case</Text>
                    <SegmentedControl
                      options={caseOptions}
                      value={letterCase}
                      colors={colors}
                      onChange={(value) => {
                        setPreferredCase(value);
                        resetCanvas();
                      }}
                    />
                  </View>
                ) : null}
                <WritingPrompt
                  latin={character.latin}
                  letterCase={letterCase}
                  sampleCount={labelCount}
                  colors={colors}
                />
                <DrawingCanvas
                  colors={colors}
                  strokes={strokes}
                  onStrokeEnd={(stroke) => setStrokes((prev) => [...prev, stroke])}
                  onSizeChange={setCanvasSize}
                  onDrawingChange={setDrawing}
                  aspectRatio={script.diagramCrop.width / script.diagramCrop.height}
                  diagram={
                    diagramSource
                      ? {
                          source: diagramSource,
                          size: script.diagramSize,
                          crop: script.diagramCrop,
                          visible: showDiagram,
                          opacity: DIAGRAM_OPACITY,
                        }
                      : undefined
                  }
                />
                <ToggleRow
                  label="Show stroke diagram"
                  description={`Drawn under your ink at ${Math.round(DIAGRAM_OPACITY * 100)}% opacity`}
                  value={showDiagram}
                  onValueChange={setShowDiagram}
                  colors={colors}
                />
                <View style={styles.actionRow}>
                  <AppButton
                    label="Clear"
                    variant="secondary"
                    colors={colors}
                    disabled={!hasInk}
                    onPress={resetCanvas}
                    style={styles.actionButton}
                  />
                  <AppButton
                    label={saving ? "Saving…" : "Submit"}
                    variant="primary"
                    colors={colors}
                    disabled={!hasInk || saving}
                    onPress={() => void handleSubmit()}
                    style={styles.actionButton}
                  />
                </View>
                <AppButton
                  label="Undo last stroke"
                  variant="ghost"
                  colors={colors}
                  disabled={!hasInk}
                  onPress={() => setStrokes((prev) => prev.slice(0, -1))}
                />
              </>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No collectable characters</Text>
                <Text style={styles.emptyText}>
                  {`Entries in data/${script?.id ?? "<script>"}/ need a "key" matching a stroke diagram registered in ` +
                    `data/handwriting/${script?.id ?? "<script>"}.ts (add "upper" too for bicameral letters). ` +
                    `Check the console for the list of skipped entries.`}
                </Text>
              </View>
            )}
          </>
        )}
        {status ? (
          <Text style={[styles.status, status.kind === "error" && styles.statusError]}>{status.text}</Text>
        ) : null}
        <View style={styles.divider} />
        <View style={styles.statsRow}>
          <Text style={styles.stat}>This session: {sessionCount}</Text>
          <Text style={styles.stat}>Stored: {storedTotal}</Text>
        </View>
        <AppButton
          label={exporting ? "Exporting…" : "Export all samples"}
          variant="primary"
          colors={colors}
          disabled={exporting || storedTotal === 0}
          onPress={() => void handleExport()}
        />
        <AppButton
          label="Delete stored samples"
          variant="danger"
          colors={colors}
          disabled={storedTotal === 0}
          onPress={handleDeleteAll}
        />
        <Text style={styles.footerNote}>
          Export writes a single JSON bundle (raw point sequences + resampled [dx, dy, dt, pen_up] features)
          {Platform.OS === "web" ? " as a browser download." : " and opens the share sheet."}
        </Text>
      </ScrollView>
    </View>
  );
}
function makeStyles(colors: ScriptColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 56, gap: 16 },
    heading: { fontSize: 22, fontFamily: "NotoSerif_700Bold", color: colors.onPrimary },
    subheading: { fontSize: 13, fontFamily: "NotoSerif_300Light_Italic", color: colors.muted, marginTop: 2 },
    field: { gap: 8 },
    fieldLabel: {
      fontSize: 12,
      letterSpacing: 1,
      textTransform: "uppercase",
      fontFamily: "NotoSerif_600SemiBold",
      color: colors.muted,
    },
    actionRow: { flexDirection: "row", gap: 12 },
    actionButton: { flex: 1 },
    empty: {
      borderWidth: 2,
      borderColor: colors.accent,
      borderRadius: 12,
      padding: 16,
      gap: 6,
      backgroundColor: colors.primary,
    },
    emptyTitle: { fontSize: 16, fontFamily: "NotoSerif_600SemiBold", color: colors.onPrimary },
    emptyText: { fontSize: 13, lineHeight: 19, fontFamily: "NotoSerif_400Regular", color: colors.muted },
    status: { fontSize: 14, textAlign: "center", fontFamily: "NotoSerif_600SemiBold", color: "#22c55e" },
    statusError: { color: "#ef4444" },
    divider: { height: 1, backgroundColor: colors.muted, opacity: 0.3 },
    statsRow: { flexDirection: "row", justifyContent: "space-between" },
    stat: { fontSize: 14, fontFamily: "NotoSerif_400Regular", color: colors.onPrimary },
    footerNote: {
      fontSize: 11,
      textAlign: "center",
      fontFamily: "NotoSerif_300Light_Italic",
      color: colors.muted,
    },
  });
}