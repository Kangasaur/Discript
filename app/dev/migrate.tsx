import { useCallback, useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import AppButton from "@/components/ui/AppButton";
import { DEV_FALLBACK_COLORS as COLORS } from "@/utils/devTheme";
import { FEATURE_FORMAT } from "@/utils/ink";
import {
  migrateAllSamples,
  scanSamples,
  type MigrationResult,
  type MigrationScan,
} from "@/utils/handwritingMigration";
import { exportSamples } from "@/utils/handwritingStorage";
function confirm(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    if ((globalThis as any).confirm?.(message)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: confirmLabel, onPress: onConfirm },
  ]);
}
export default function MigrateScreen() {
  const [scan, setScan] = useState<MigrationScan | null>(null);
  const [scanning, setScanning] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      setScan(await scanSamples());
    } catch (e) {
      setError((e as Error).message);
      setScan(null);
    } finally {
      setScanning(false);
    }
  }, []);
  useEffect(() => {
    void runScan();
  }, [runScan]);
  const runMigration = useCallback(() => {
    if (!scan || scan.upgradable === 0) return;
    confirm(
      "Upgrade samples",
      `Rewrite ${scan.upgradable} stored sample${scan.upgradable === 1 ? "" : "s"} with ` +
        `${FEATURE_FORMAT} features rebuilt from their raw ink? Sample ids are preserved. ` +
        "Consider exporting a backup first.",
      "Upgrade",
      () => {
        void (async () => {
          setMigrating(true);
          setResult(null);
          setError(null);
          try {
            const outcome = await migrateAllSamples((done, total) => setProgress({ done, total }));
            setResult(outcome);
            await runScan();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setMigrating(false);
            setProgress(null);
          }
        })();
      },
    );
  }, [scan, runScan]);
  const runBackup = useCallback(async () => {
    setExporting(true);
    setError(null);
    try {
      await exportSamples();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(false);
    }
  }, []);
  const busy = scanning || migrating || exporting;
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.heading}>Sample schema migration</Text>
          <Text style={styles.subheading}>
            Rebuilds the feature representation of locally stored samples from their raw ink
            (normalize → resample → deltas). Safe to re-run; up-to-date samples are skipped.
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Local storage</Text>
          {scanning ? (
            <Text style={styles.line}>Scanning…</Text>
          ) : scan ? (
            <>
              <Text style={styles.line}>Total samples: {scan.total}</Text>
              {Object.entries(scan.formats)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([format, count]) => (
                  <Text key={format} style={styles.lineMuted}>
                    {format}: {count}
                  </Text>
                ))}
              <View style={styles.dividerThin} />
              <Text style={styles.line}>Up to date: {scan.current}</Text>
              <Text style={[styles.line, scan.upgradable > 0 && styles.lineAccent]}>
                Upgradable: {scan.upgradable}
              </Text>
              {scan.unreadable > 0 ? (
                <Text style={styles.lineError}>
                  Missing raw ink (cannot upgrade): {scan.unreadable}
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.lineMuted}>No scan data.</Text>
          )}
        </View>
        <AppButton
          label={exporting ? "Exporting…" : "Export backup first"}
          variant="secondary"
          colors={COLORS}
          disabled={busy || !scan || scan.total === 0}
          onPress={() => void runBackup()}
        />
        <AppButton
          label={
            migrating
              ? progress
                ? `Upgrading… ${progress.done}/${progress.total}`
                : "Upgrading…"
              : `Upgrade ${scan?.upgradable ?? 0} sample${scan?.upgradable === 1 ? "" : "s"} to v2`
          }
          variant="primary"
          colors={COLORS}
          disabled={busy || !scan || scan.upgradable === 0}
          onPress={runMigration}
        />
        <AppButton
          label="Re-scan"
          variant="ghost"
          colors={COLORS}
          disabled={busy}
          onPress={() => void runScan()}
        />
        {result ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Result</Text>
            <Text style={[styles.line, styles.lineOk]}>Migrated: {result.migrated}</Text>
            <Text style={styles.line}>Skipped (already current): {result.skipped}</Text>
            {result.failed.length > 0 ? (
              <>
                <Text style={styles.lineError}>Failed: {result.failed.length}</Text>
                {result.failed.slice(0, 5).map((failure) => (
                  <Text key={failure.id} style={styles.lineErrorDetail} numberOfLines={2}>
                    {failure.id}: {failure.error}
                  </Text>
                ))}
                {result.failed.length > 5 ? (
                  <Text style={styles.lineMuted}>…and {result.failed.length - 5} more</Text>
                ) : null}
              </>
            ) : null}
          </View>
        ) : null}
        {error ? <Text style={styles.lineError}>{error}</Text> : null}
        <Text style={styles.footerNote}>
          Previously exported v1 bundles are not touched — re-export after migrating to get a v2
          bundle. Rejects files stay valid because sample ids are preserved.
        </Text>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 56, gap: 16 },
  heading: { fontSize: 22, fontFamily: "NotoSerif_700Bold", color: COLORS.onPrimary },
  subheading: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "NotoSerif_300Light_Italic",
    color: COLORS.muted,
    marginTop: 4,
  },
  card: {
    borderWidth: 2,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  cardTitle: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: "NotoSerif_600SemiBold",
    color: COLORS.muted,
    marginBottom: 4,
  },
  dividerThin: { height: 1, backgroundColor: COLORS.muted, opacity: 0.3, marginVertical: 6 },
  line: { fontSize: 14, fontFamily: "NotoSerif_400Regular", color: COLORS.onPrimary },
  lineMuted: { fontSize: 13, fontFamily: "NotoSerif_400Regular", color: COLORS.muted },
  lineAccent: { fontFamily: "NotoSerif_600SemiBold" },
  lineOk: { color: "#22c55e", fontFamily: "NotoSerif_600SemiBold" },
  lineError: { fontSize: 13, fontFamily: "NotoSerif_600SemiBold", color: "#ef4444" },
  lineErrorDetail: { fontSize: 12, fontFamily: "NotoSerif_400Regular", color: "#ef4444" },
  footerNote: {
    fontSize: 11,
    textAlign: "center",
    fontFamily: "NotoSerif_300Light_Italic",
    color: COLORS.muted,
  },
});