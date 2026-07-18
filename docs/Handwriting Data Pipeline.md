  # Handwriting Data Pipeline
Dev-only tooling for collecting, storing, exporting, and inspecting labelled handwriting
samples used to train the writing-quiz recognition model (per Carbune et al. 2020,
"Fast Multi-language LSTM-based Online Handwriting Recognition").
## Pipeline overview
```
lesson data (Entry) ──┐
                      ├─> /dev/handwriting ──> buildSample() ──> local storage ──> export bundle (.json)
stroke diagrams ──────┘         capture          derive            1 file/sample        │
                                                                        │               ▼
                                                    /dev/migrate  <────┘      tools/view_handwriting_samples.py
                                                 (schema upgrades)            (visual QA + rejects file)
```
1. **Capture** — raw touch points `(x, y, t)` grouped into strokes, in canvas pixels, `t` in ms since the sample's first touch.
2. **Derive** — `buildSample()` keeps the raw ink verbatim and computes the feature representation: normalize → equidistant resample → delta encode.
3. **Store** — one JSON file per sample in `documentDirectory/handwriting-samples/` (web: localStorage). The label is encoded in the filename, so counting never requires reads.
4. **Export** — all samples bundled into one JSON file and shared off-device (web: browser download).
5. **Inspect** — Python viewer renders each sample; rejected ids are written to a sidecar file that the training prep should filter on.
Labels are built automatically from the current selection; sample ids look like
`cyrillic--zh--upper--<timestamp>-<rand>` (`--` is the reserved separator — keys must not contain it).
## Dev tools
Access: `DEV TOOLS` pill on the home screen (renders only when `__DEV__`) → `/dev` hub.
Routes under `app/dev/` redirect home in production builds.
### `/dev/handwriting` — sample collection
- Script selector (always visible), character picker (chips + prev/next arrows, auto-scroll), case toggle shown only when both upper and lower stroke diagrams exist.
- Prompt shows the romanization (`Entry.latin`) and case — never the glyph, matching the future quiz.
- Drawing canvas: aspect ratio derived from `diagramCrop`; parent scroll locks while the pen is down.
- Stroke-diagram overlay toggle, rendered under the ink at 30% opacity and aligned exactly to the canvas via `diagramCrop`.
- Clear / Undo-last-stroke / Submit (saves, clears, shows stroke/point/resampled counts).
- Per-label and total sample counters; Export all; Delete stored samples (confirm).
### `/dev/migrate` — schema migration
- Scans local storage and reports counts per `features.format`, plus up-to-date / upgradable / missing-raw-ink.
- "Export backup first" button (plain `exportSamples()`).
- Upgrades out-of-date samples in place by rebuilding `features` + `stats` from raw ink; ids, files, labels, timestamps untouched.
- Idempotent — re-running skips current samples; failures are reported per-sample without aborting.
### `tools/view_handwriting_samples.py` — visual QA (Python, matplotlib)
```bash
python tools/view_handwriting_samples.py  [--rejects f.json] [--mode ink|features]
```
- Two views, toggleable (`m`): `display_ink` (absolute canvas px) and `display_features` (delta-sequence reconstruction via cumulative sum, re-centered).
- Point color encodes time (green → red); blue numbers mark stroke order.
- Prev/Next (`←`/`→`), seek-by-index box, filter box (substring over script / key / case / latin / glyph / label id).
- Reject (`r`) toggles "unfit for training"; persisted immediately to `<export>.rejects.json` as `{"rejected": [ids]}`, keyed by sample id so it survives re-exports. Training prep must drop these ids.
## Key modules
### Data
- `data/lessons.ts` — static registry of lesson JSON per script (Metro requires static imports; new lessons get one import line). `getLessons(scriptId)` (ordered by `meta.json`), `getEntries(scriptId)`, `getScriptMeta(scriptId)`.
- `data/handwriting/<script>.ts` — `ScriptDiagramSet`: stroke-diagram `require`s keyed by `Entry.key`, plus `diagramSize` and `diagramCrop`. The crop is the single source of truth for canvas aspect ratio and overlay alignment.
- `data/handwriting/index.ts` — joins entries × diagrams into `HandwritingScript[]` (cached). `getHandwritingScripts()`, `availableCases()` (diagram-driven), `glyphFor()`. Entries without a `key`, or keys without diagrams, are skipped with a dev warning.
- `Entry` (in `types/data.ts`) supplies `key` (stable id, matches asset basenames), `latin`, `character` (base/lowercase glyph), optional `upper`.
### Utils
- `utils/ink.ts` — pure geometry, no RN imports (vitest-safe). `normalizeStrokes` (center on bbox midpoint, scale so bbox height = 1, screen y-down preserved), `resampleStroke` / `resampleStrokes` (equidistant linear resampling, `RESAMPLE_DELTA = 0.05`; count = `max(2, round(L/δ))` via arc-length linspace, endpoints kept, timestamps interpolated; dots stay single points), `toPointDeltaSequence` (`[dx, dy, dt_ms, pen_up]`, deltas carry across stroke boundaries, `pen_up = 1` on each stroke's last point), `serializeStrokes`, `inkBounds`, `strokeToSvgPath` (display-only smoothing).
- `utils/handwritingSamples.ts` — `buildFeatures(strokes)` (the normalize → resample → delta pipeline; shared with migration), `buildSample(...)`, sample-id encode/decode (`buildSampleId`, `decodeSampleId`, `labelId`, `countsByLabel`), `buildExportBundle`.
- `utils/handwritingStorage.ts` — all platform I/O. `saveSample` (write/overwrite by id), `listSampleIds` (filename-only), `loadAllSamples`, `deleteAllSamples`, `exportSamples` (write + share sheet; web: blob download). **SDK-sensitive:** uses the legacy `expo-file-system` API — on Expo SDK 54+ the import must be `"expo-file-system/legacy"` (a runtime guard throws a message saying so).
- `utils/handwritingMigration.ts` — `needsUpgrade`, `upgradeSample` (rebuild derived fields from raw ink), `scanSamples` (dry run), `migrateAllSamples`.
### Components (reusable in the writing quiz)
`DrawingCanvas`, `StrokeDiagramOverlay`, `WritingPrompt`, `CharacterPicker`, and the `ui/`
primitives all take `colors: ScriptColors` as a prop — in the quiz, pass `useScriptTheme().colors`.
## Sample shape (schema v2, `features.format = "point-deltas/v2"`)
```jsonc
{
  "id": "cyrillic--zh--upper--1718041000000-9fk2la", // script--key--case--ts-rand; never changes after creation
  "label": {
    "script": "cyrillic",
    "key": "zh",            // Entry.key — matches diagram/audio basenames
    "latin": "zh",          // Entry.latin — the prompt shown to the writer
    "case": "upper",
    "character": "Ж"        // glyph via Entry.character / Entry.upper
  },
  "createdAt": "2024-06-10T12:00:00.000Z",
  "canvas": { "width": 340, "height": 243 },   // drawing surface in px at capture time
  // Source of truth. Untouched by migrations; everything below is derivable from it.
  "ink": {
    "format": "raw-touch-points/v1",
    "units": "canvas-px",
    "strokes": [                  // one array per pen-down..pen-up
      [ [x, y, t_ms], ... ]       // t relative to the sample's first touch
    ]
  },
  // Derived model input: normalize -> resample -> delta encode.
  "features": {
    "format": "point-deltas/v2",
    "dims": ["dx", "dy", "dt_ms", "pen_up"],
    "normalization": {
      "reference": "ink-bbox-height",          // bbox height scaled to 1.0
      "scale": 0.0112,                          // raw px * scale = normalized units
      "center": { "x": 171.2, "y": 120.8 }      // raw-px point mapped to the origin
    },
    "resampling": { "method": "equidistant-linear", "delta": 0.05 },
    "points": [ [dx, dy, dt, pen_up], ... ]     // one flat sequence across all strokes;
                                                // first point is [0,0,0,·]; pen_up=1 ends a stroke,
                                                // so the next row is the pen-up jump
  },
  "stats": {
    "strokeCount": 3,
    "pointCount": 214,          // captured touch points
    "featurePointCount": 87,    // == features.points.length (post-resampling)
    "durationMs": 1650
  },
  "device": { "os": "ios", "osVersion": "17.4" }
}
```
Export bundle: `{ schemaVersion: 2, exportedAt, inkFormat, featureFormat, featureDims, notes,
sampleCount, counts (per label id), samples[] }`, filename `handwriting-<iso>.json`.
## When the schema changes
1. Update the representation in `utils/ink.ts` / `utils/handwritingSamples.ts`. Keep all derived
   logic inside `buildFeatures()` so capture and migration can't diverge. Never change `ink` — it
   is the raw record everything is rebuilt from.
2. Bump version markers: `FEATURE_FORMAT` (e.g. `point-deltas/v3`) and `EXPORT_SCHEMA_VERSION`.
3. Update the types in `types/handwriting.ts`.
4. Extend `needsUpgrade()` in `utils/handwritingMigration.ts` so it detects every older shape
   (check format string *and* presence of any new fields — keeps it idempotent). Extend
   `upgradeSample()` only if new fields aren't already produced by `buildFeatures()`.
5. Update/extend `tests/ink.test.ts` with the new contract.
6. Run **Dev Tools → Sample schema migration**: export a backup, upgrade, confirm `Upgradable: 0`.
7. Re-export; old bundles on disk stay at their old version. Update
   `tools/view_handwriting_samples.py` only if `ink.strokes` or the `features.points` row layout
   changed. Rejects files remain valid (keyed by id).
8. Document the new shape here.
## Not yet implemented
- **Bézier curve features** — the paper's preferred input. Fit curves to `ink.strokes`
  (raw ink retained for exactly this), add a `features.format = "bezier-curves/v1"` variant,
  and migrate via the steps above.
- **Training prep script** — consume export bundles, drop ids listed in `*.rejects.json`,
  emit model-ready tensors.
- **Writing quiz screen** — reuse `DrawingCanvas`/`WritingPrompt` with `useScriptTheme()`, run
  inference against the trained model instead of saving samples.
- **Unicameral scripts** — case handling assumes upper/lower; scripts without case will need
  `availableCases`/UI to degrade to a single caseless mode.
- **Android export to Downloads** — currently share-sheet only; optional
  `StorageAccessFramework` path in `exportSamples()`.
- **Strict-δ resampling (optional)** — current resampling is arc-length linspace with
  `n = max(2, round(L/δ))` (endpoints preserved, matches the paper's "20 points per unit length").
  If exact δ spacing is ever required, switch to 0, δ, 2δ… stepping in `resampleStroke` and bump
  the feature format.
```