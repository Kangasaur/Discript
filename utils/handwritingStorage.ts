import { Platform } from "react-native";
import * as FileSystemModule from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import type { HandwritingSample } from "@/types/handwriting";
import {
  buildExportBundle,
  exportFileName,
  sampleFileName,
  sampleIdFromFileName,
} from "./handwritingSamples";

// Loosely typed so this file compiles against both the legacy and new SDK typings.
const FS = FileSystemModule as any;

const isWeb = Platform.OS === "web";
const SAMPLES_DIR = "handwriting-samples";
const EXPORTS_DIR = "handwriting-exports";
const WEB_KEY = "dev:handwriting-samples";

export interface ExportResult {
  fileName: string;
  uri: string;
  count: number;
  shared: boolean;
}

function requireDocumentDirectory(): string {
  const dir = FS.documentDirectory;
  if (typeof dir !== "string" || dir.length === 0) {
    throw new Error(
      "expo-file-system's legacy API is unavailable. On Expo SDK 54+, change the import at the " +
        'top of utils/handwritingStorage.ts to "expo-file-system/legacy".',
    );
  }
  return dir;
}

function samplesDir(): string {
  return `${requireDocumentDirectory()}${SAMPLES_DIR}/`;
}

async function ensureDirectory(uri: string): Promise<void> {
  const info = await FS.getInfoAsync(uri);
  if (!info?.exists) await FS.makeDirectoryAsync(uri, { intermediates: true });
}

function webStorage(): any | null {
  const g = globalThis as any;
  return g?.localStorage ?? null;
}

function webRead(): Record<string, HandwritingSample> {
  const store = webStorage();
  if (!store) return {};
  try {
    return JSON.parse(store.getItem(WEB_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function webWrite(value: Record<string, HandwritingSample>): void {
  webStorage()?.setItem(WEB_KEY, JSON.stringify(value));
}

function byCreatedAt(a: HandwritingSample, b: HandwritingSample): number {
  return a.createdAt.localeCompare(b.createdAt);
}

export async function saveSample(sample: HandwritingSample): Promise<void> {
  if (isWeb) {
    const store = webRead();
    store[sample.id] = sample;
    webWrite(store);
    return;
  }
  const dir = samplesDir();
  await ensureDirectory(dir);
  await FS.writeAsStringAsync(`${dir}${sampleFileName(sample.id)}`, JSON.stringify(sample));
}

/** Cheap: labels are encoded in the filenames, so no file reads needed. */
export async function listSampleIds(): Promise<string[]> {
  if (isWeb) return Object.keys(webRead());

  const dir = samplesDir();
  const info = await FS.getInfoAsync(dir);
  if (!info?.exists) return [];
  const files: string[] = await FS.readDirectoryAsync(dir);
  return files.filter((f) => f.endsWith(".json")).map(sampleIdFromFileName);
}

export async function loadAllSamples(): Promise<HandwritingSample[]> {
  if (isWeb) return Object.values(webRead()).sort(byCreatedAt);

  const dir = samplesDir();
  const info = await FS.getInfoAsync(dir);
  if (!info?.exists) return [];

  const files: string[] = await FS.readDirectoryAsync(dir);
  const samples: HandwritingSample[] = [];
  for (const file of files.filter((f) => f.endsWith(".json"))) {
    try {
      samples.push(JSON.parse(await FS.readAsStringAsync(`${dir}${file}`)));
    } catch {
      // skip corrupt file
    }
  }
  return samples.sort(byCreatedAt);
}

export async function deleteAllSamples(): Promise<void> {
  if (isWeb) {
    webWrite({});
    return;
  }
  await FS.deleteAsync(samplesDir(), { idempotent: true });
}

export async function exportSamples(): Promise<ExportResult> {
  const samples = await loadAllSamples();
  const json = JSON.stringify(buildExportBundle(samples), null, 2);
  const fileName = exportFileName();

  if (isWeb) {
    const g = globalThis as any;
    const url = g.URL.createObjectURL(new g.Blob([json], { type: "application/json" }));
    const link = g.document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    g.URL.revokeObjectURL(url);
    return { fileName, uri: fileName, count: samples.length, shared: true };
  }

  const dir = `${requireDocumentDirectory()}${EXPORTS_DIR}/`;
  await ensureDirectory(dir);
  const uri = `${dir}${fileName}`;
  await FS.writeAsStringAsync(uri, json);

  let shared = false;
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/json",
      UTI: "public.json",
      dialogTitle: "Export handwriting samples",
    });
    shared = true;
  }
  return { fileName, uri, count: samples.length, shared };
}