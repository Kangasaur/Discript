import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import AppButton from "@/components/ui/AppButton";
import SegmentedControl, { type SegmentedOption } from "@/components/ui/SegmentedControl";
import ToggleRow from "@/components/ui/ToggleRow";
import CharacterPicker from "@/components/writing/CharacterPicker";
import DrawingCanvas from "@/components/writing/DrawingCanvas";
import WritingPrompt from "@/components/writing/WritingPrompt";
import {
  HANDWRITING_SCRIPTS,
  availableCases,
  getHandwritingCharacter,
  getHandwritingScript,
} from "@/data/handwriting";
import type { ScriptColors } from "@/types/data";
import type { InkStroke, LetterCase, SampleLabel } from "@/types/handwriting";
import { resolveScriptColors } from "@/utils/devTheme";
import { buildSample, countsByLabel, labelId } from "@/utils/handwritingSamples";
import {
  deleteAllSamples,
  exportSamples,
  listSampleIds,
  saveSample,
} from "@/utils/handwritingStorage";

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
  const scripts = HANDWRITING_SCRIPTS;

  const [scriptId, setScriptId] = useState(scripts[0]?.id ?? "");
  const script = getHandwritingScript(scriptId) ?? scripts[0];

  const [characterKey, setCharacterKey] = useState(script.characters[0].key);
  const character = getHandwritingCharacter(script, characterKey) ?? script.characters[0];

  const cases = useMemo(() => availableCases(character), [character]);
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

  const colors = useMemo(() => resolveScriptColors(scriptId), [scriptId]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const label: SampleLabel = useMemo(
    () => ({
      script: script.id,
      key: character.key,
      latin: character.latin,
      case: letterCase,
      character: character.glyphs[letterCase],
    }),
    [script.id, character, letterCase],
  );

  const storedTotal = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);
  const labelCount = counts[labelId(label)] ?? 0;
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

  const handleSubmit = useCallback(async () => {
    if (!hasInk || saving || canvasSize.width === 0) return;
    setSaving(true);
    try {
      const sample = buildSample({ label, strokes, canvas: canvasSize });
      await saveSample(sample);
      setCounts((prev) => ({ ...prev, [labelId(label)]: (prev[labelId(label)] ?? 0) + 1 }));
      setSessionCount((n) => n + 1);
      setStrokes([]);
      setStatus({
        kind: "ok",
        text: `Saved ${sample.label.character ?? sample.label.latin} (${sample.stats.strokeCount} strokes, ${sample.stats.pointCount} points)`,
      });
    } catch (error) {
      setStatus({ kind: "error", text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  }, [hasInk, saving, canvasSize, label, strokes]);

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
  const caseOptions: SegmentedOption<LetterCase>[] = [
    { value: "upper", label: "Uppercase" },
    { value: "lower", label: "Lowercase" },
  ].filter((option) => cases.includes(option.value as LetterCase)) as SegmentedOption<LetterCase>[];

  const diagramSource = character.diagrams[letterCase];

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        scrollEnabled={!drawing}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text style={styles.heading}>Handwriting data collection</Text>
          <Text style={styles.subheading}>
            Samples are labelled automatically from the selection below.
          </Text>
        </View>

        {scriptOptions.length > 1 ? (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Script</Text>
            <SegmentedControl
              options={scriptOptions}
              value={scriptId}
              colors={colors}
              onChange={(id) => {
                setScriptId(id);
                const next = getHandwritingScript(id);
                if (next) setCharacterKey(next.characters[0].key);
                resetCanvas();
              }}
            />
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Character</Text>
          <CharacterPicker
            characters={script.characters}
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
          name={character.name}
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

        {status ? (
          <Text style={[styles.status, status.kind === "error" && styles.statusError]}>
            {status.text}
          </Text>
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
          Export writes a single JSON bundle (raw point sequences + [dx, dy, dt, pen_up] features)
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
    subheading: {
      fontSize: 13,
      fontFamily: "NotoSerif_300Light_Italic",
      color: colors.muted,
      marginTop: 2,
    },
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
    status: {
      fontSize: 14,
      textAlign: "center",
      fontFamily: "NotoSerif_600SemiBold",
      color: "#22c55e",
    },
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