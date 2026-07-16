"""
Visual inspector for exported handwriting sample bundles.
Usage:
    python tools/view_handwriting_samples.py <export.json> [--rejects rejects.json] [--mode ink|features]
Controls:
    Prev / Next buttons  (or left/right arrow keys)
    Mode button          (or 'm') - switch between display_ink and display_features
    Reject button        (or 'r') - toggle "unfit for training" on the current sample
    Filter box           - substring match on script / key / case / latin / label id
                           (e.g. "cyrillic", "zh", "upper", "cyrillic--zh--upper")
    Go-to box            - 1-based index within the current filtered list
Rejections are persisted immediately to a sidecar JSON file (default:
<export>.rejects.json) as {"rejected": [sample ids...]}. When you build the
training set, drop every sample whose id appears in that file.
Point colour encodes time: green = first touch, red = last point.
"""
from __future__ import annotations
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, Normalize
from matplotlib.patches import Rectangle
from matplotlib.widgets import Button, TextBox
TIME_CMAP = LinearSegmentedColormap.from_list("ink_time", ["#22c55e", "#eab308", "#ef4444"])
REJECT_COLOR = "#ef4444"
OK_COLOR = "#111827"
# ---------------------------------------------------------------------------
# Representation -> stroke lists  (each stroke: list of (x, y, t))
# ---------------------------------------------------------------------------
def ink_strokes(sample: dict) -> list[list[tuple[float, float, float]]]:
    """Raw point sequence, absolute canvas px."""
    return [[(p[0], p[1], p[2]) for p in stroke] for stroke in sample["ink"]["strokes"]]
def feature_strokes(sample: dict) -> list[list[tuple[float, float, float]]]:
    """
    Reconstruct positions from the [dx, dy, dt, pen_up] feature sequence by
    cumulative summation. pen_up == 1 marks the last point of a stroke.
    Note: the delta representation is translation-invariant (the first point's
    absolute position is not stored), so we re-center the reconstruction on its
    bounding box to mimic the original normalization.
    """
    strokes: list[list[tuple[float, float, float]]] = []
    current: list[tuple[float, float, float]] = []
    x = y = t = 0.0
    for dx, dy, dt, pen_up in sample["features"]["points"]:
        x += dx
        y += dy
        t += dt
        current.append((x, y, t))
        if pen_up:
            strokes.append(current)
            current = []
    if current:
        strokes.append(current)
    # re-center on bbox midpoint
    xs = [p[0] for s in strokes for p in s]
    ys = [p[1] for s in strokes for p in s]
    if xs:
        cx = (min(xs) + max(xs)) / 2.0
        cy = (min(ys) + max(ys)) / 2.0
        strokes = [[(px - cx, py - cy, pt) for px, py, pt in s] for s in strokes]
    return strokes
# ---------------------------------------------------------------------------
# Drawing
# ---------------------------------------------------------------------------
def _draw_strokes(ax, strokes) -> None:
    t_max = max((p[2] for s in strokes for p in s), default=0.0)
    norm = Normalize(vmin=0.0, vmax=max(t_max, 1e-9))
    for i, stroke in enumerate(strokes):
        xs = [p[0] for p in stroke]
        ys = [p[1] for p in stroke]
        ts = [p[2] for p in stroke]
        ax.plot(xs, ys, color="#9ca3af", lw=1.0, alpha=0.6, zorder=1)
        ax.scatter(xs, ys, c=ts, cmap=TIME_CMAP, norm=norm, s=16, zorder=2)
        ax.annotate(
            str(i + 1),
            (xs[0], ys[0]),
            textcoords="offset points",
            xytext=(6, 6),
            fontsize=9,
            color="#2563eb",
            weight="bold",
            zorder=3,
        )
def display_ink(sample: dict, ax) -> None:
    """Base ink representation: absolute canvas pixels, y-down like the app."""
    strokes = ink_strokes(sample)
    _draw_strokes(ax, strokes)
    canvas = sample.get("canvas", {})
    w, h = canvas.get("width"), canvas.get("height")
    if w and h:
        ax.add_patch(Rectangle((0, 0), w, h, fill=False, ec="#d1d5db", lw=1.5, zorder=0))
        ax.set_xlim(-0.05 * w, 1.05 * w)
        ax.set_ylim(1.05 * h, -0.05 * h)  # invert y -> screen orientation
    else:
        ax.invert_yaxis()
    ax.set_aspect("equal")
    ax.set_xlabel("x (canvas px)")
    ax.set_ylabel("y (canvas px)")
def display_features(sample: dict, ax) -> None:
    """Feature representation: centered, ink-bbox-height == 1, y-down."""
    strokes = feature_strokes(sample)
    _draw_strokes(ax, strokes)
    xs = [p[0] for s in strokes for p in s]
    ys = [p[1] for s in strokes for p in s]
    if xs:
        pad = 0.15 * max(max(xs) - min(xs), max(ys) - min(ys), 1.0)
        ax.set_xlim(min(xs) - pad, max(xs) + pad)
        ax.set_ylim(max(ys) + pad, min(ys) - pad)  # invert y
    ax.axhline(0.0, color="#d1d5db", lw=0.8, zorder=0)
    ax.axvline(0.0, color="#d1d5db", lw=0.8, zorder=0)
    for yline in (-0.5, 0.5):
        ax.axhline(yline, color="#e5e7eb", lw=0.8, ls="--", zorder=0)
    ax.set_aspect("equal")
    ax.set_xlabel("x (normalized, bbox height = 1)")
    ax.set_ylabel("y (normalized)")
DISPLAY_MODES = {"ink": display_ink, "features": display_features}
# ---------------------------------------------------------------------------
# Viewer
# ---------------------------------------------------------------------------
def label_id(sample: dict) -> str:
    label = sample.get("label", {})
    return "--".join([label.get("script", "?"), label.get("key", "?"), label.get("case", "?")])
def search_text(sample: dict) -> str:
    label = sample.get("label", {})
    parts = [
        label.get("script", ""),
        label.get("key", ""),
        label.get("case", ""),
        label.get("latin", ""),
        label.get("character", "") or "",
        label_id(sample),
        sample.get("id", ""),
    ]
    return " ".join(parts).lower()
class SampleViewer:
    def __init__(self, bundle: dict, rejects_path: Path, mode: str) -> None:
        self.samples: list[dict] = bundle.get("samples", [])
        self.rejects_path = rejects_path
        self.rejected: set[str] = self._load_rejects()
        self.mode = mode
        self.filter_text = ""
        self.filtered: list[int] = list(range(len(self.samples)))
        self.pos = 0
        self._build_figure()
        self.redraw()
    # -- persistence --------------------------------------------------------
    def _load_rejects(self) -> set[str]:
        if self.rejects_path.exists():
            try:
                data = json.loads(self.rejects_path.read_text(encoding="utf-8"))
                return set(data.get("rejected", []))
            except (OSError, json.JSONDecodeError):
                print(f"warning: could not read {self.rejects_path}", file=sys.stderr)
        return set()
    def _save_rejects(self) -> None:
        payload = {
            "updatedAt": datetime.now(timezone.utc).isoformat(),
            "rejected": sorted(self.rejected),
        }
        self.rejects_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    # -- figure / widgets ----------------------------------------------------
    def _build_figure(self) -> None:
        self.fig = plt.figure(figsize=(9, 7.5))
        try:
            self.fig.canvas.manager.set_window_title("Handwriting sample viewer")
        except AttributeError:
            pass
        self.ax = self.fig.add_axes([0.09, 0.24, 0.84, 0.66])
        self.fig.text(0.09, 0.015, "point colour: green = start \u2192 red = end   |   blue numbers = stroke order",
                      fontsize=9, color="#6b7280")
        def wax(left, width, bottom=0.12, height=0.055):
            return self.fig.add_axes([left, bottom, width, height])
        self.prev_btn = Button(wax(0.09, 0.09), "\u25c0 Prev")
        self.next_btn = Button(wax(0.20, 0.09), "Next \u25b6")
        self.mode_btn = Button(wax(0.31, 0.16), f"Mode: {self.mode}")
        self.reject_btn = Button(wax(0.49, 0.12), "Reject")
        self.seek_box = TextBox(wax(0.70, 0.08), "Go to ", initial="")
        self.filter_box = TextBox(wax(0.31, 0.30, bottom=0.045), "Filter ", initial="")
        self.prev_btn.on_clicked(lambda _: self.step(-1))
        self.next_btn.on_clicked(lambda _: self.step(1))
        self.mode_btn.on_clicked(lambda _: self.toggle_mode())
        self.reject_btn.on_clicked(lambda _: self.toggle_reject())
        self.seek_box.on_submit(self.seek)
        self.filter_box.on_submit(self.apply_filter)
        self.fig.canvas.mpl_connect("key_press_event", self._on_key)
    def _typing(self) -> bool:
        return any(
            getattr(box, "capturekeystrokes", False)
            for box in (self.seek_box, self.filter_box)
        )
    def _on_key(self, event) -> None:
        if self._typing():
            return
        if event.key in ("left", "p"):
            self.step(-1)
        elif event.key in ("right", "n"):
            self.step(1)
        elif event.key == "m":
            self.toggle_mode()
        elif event.key == "r":
            self.toggle_reject()
    # -- state ----------------------------------------------------------------
    def current(self) -> dict | None:
        if not self.filtered:
            return None
        return self.samples[self.filtered[self.pos]]
    def step(self, delta: int) -> None:
        if not self.filtered:
            return
        self.pos = (self.pos + delta) % len(self.filtered)
        self.redraw()
    def seek(self, text: str) -> None:
        text = text.strip()
        if not text or not self.filtered:
            return
        try:
            index = int(text) - 1
        except ValueError:
            print(f"not a number: {text!r}", file=sys.stderr)
            return
        self.pos = max(0, min(index, len(self.filtered) - 1))
        self.redraw()
    def apply_filter(self, text: str) -> None:
        self.filter_text = text.strip().lower()
        if self.filter_text:
            self.filtered = [
                i for i, s in enumerate(self.samples) if self.filter_text in search_text(s)
            ]
        else:
            self.filtered = list(range(len(self.samples)))
        self.pos = 0
        print(f"filter {self.filter_text!r}: {len(self.filtered)}/{len(self.samples)} samples")
        self.redraw()
    def toggle_mode(self) -> None:
        self.mode = "features" if self.mode == "ink" else "ink"
        self.mode_btn.label.set_text(f"Mode: {self.mode}")
        self.redraw()
    def toggle_reject(self) -> None:
        sample = self.current()
        if sample is None:
            return
        sid = sample["id"]
        if sid in self.rejected:
            self.rejected.discard(sid)
        else:
            self.rejected.add(sid)
        self._save_rejects()
        self.redraw()
    # -- rendering -------------------------------------------------------------
    def redraw(self) -> None:
        self.ax.clear()
        sample = self.current()
        if sample is None:
            self.ax.text(0.5, 0.5, "no samples match the current filter",
                         ha="center", va="center", transform=self.ax.transAxes,
                         fontsize=13, color="#6b7280")
            self.ax.set_xticks([])
            self.ax.set_yticks([])
            self.fig.suptitle("")
            self.fig.canvas.draw_idle()
            return
        DISPLAY_MODES[self.mode](sample, self.ax)
        label = sample.get("label", {})
        stats = sample.get("stats", {})
        rejected = sample["id"] in self.rejected
        glyph = label.get("character") or ""
        title = (
            f"{self.pos + 1}/{len(self.filtered)}   "
            f"{label_id(sample)}   {glyph}  (latin: {label.get('latin', '?')})\n"
            f"{stats.get('strokeCount', '?')} strokes, {stats.get('pointCount', '?')} points, "
            f"{stats.get('durationMs', '?')} ms   |   {sample.get('createdAt', '')}"
            + ("   |   REJECTED" if rejected else "")
        )
        self.fig.suptitle(title, fontsize=11, color=REJECT_COLOR if rejected else OK_COLOR)
        self.reject_btn.label.set_text("Unreject" if rejected else "Reject")
        self.ax.set_facecolor("#fef2f2" if rejected else "white")
        self.fig.canvas.draw_idle()
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(description="View exported handwriting samples.")
    parser.add_argument("export", type=Path, help="exported JSON bundle")
    parser.add_argument(
        "--rejects",
        type=Path,
        default=None,
        help="sidecar file for rejected sample ids (default: <export>.rejects.json)",
    )
    parser.add_argument("--mode", choices=tuple(DISPLAY_MODES), default="ink",
                        help="initial display mode (default: ink)")
    args = parser.parse_args()
    bundle = json.loads(args.export.read_text(encoding="utf-8"))
    samples = bundle.get("samples", [])
    print(f"loaded {len(samples)} samples "
          f"(schema v{bundle.get('schemaVersion', '?')}, exported {bundle.get('exportedAt', '?')})")
    for key, count in sorted(bundle.get("counts", {}).items()):
        print(f"  {key}: {count}")
    if not samples:
        print("nothing to display", file=sys.stderr)
        sys.exit(1)
    rejects_path = args.rejects or args.export.with_suffix(".rejects.json")
    viewer = SampleViewer(bundle, rejects_path, args.mode)
    print(f"rejections will be saved to {rejects_path}")
    plt.show()
    # keep a reference so widgets aren't GC'd before show() returns
    del viewer
if __name__ == "__main__":
    main()
