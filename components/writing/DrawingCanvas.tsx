import { useEffect, useMemo, useRef, useState } from "react";
import {
  PanResponder,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type ImageSourcePropType,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import type { ScriptColors } from "@/types/data";
import type { InkPoint, InkStroke } from "@/types/handwriting";
import { clamp, strokeToSvgPath } from "@/utils/ink";
import StrokeDiagramOverlay, { type DiagramGeometry } from "./StrokeDiagramOverlay";

export interface CanvasDiagram extends DiagramGeometry {
  source: ImageSourcePropType;
  visible: boolean;
  opacity?: number;
}

interface Props {
  colors: ScriptColors;
  /** Committed strokes (owned by the parent so Clear/Undo are trivial). */
  strokes: InkStroke[];
  onStrokeEnd: (stroke: InkStroke) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  /** Fires true on pen-down, false on pen-up (use it to lock parent scrolling). */
  onDrawingChange?: (drawing: boolean) => void;
  diagram?: CanvasDiagram;
  aspectRatio?: number;
  maxWidth?: number;
  strokeWidth?: number;
  inkColor?: string;
  surfaceColor?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function DrawingCanvas({
  colors,
  strokes,
  onStrokeEnd,
  onSizeChange,
  onDrawingChange,
  diagram,
  aspectRatio = 1.4,
  maxWidth = 520,
  strokeWidth = 5,
  inkColor = "#111827",
  surfaceColor = "#ffffff",
  disabled = false,
  style,
}: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [current, setCurrent] = useState<InkStroke | null>(null);

  const pointsRef = useRef<InkPoint[]>([]);
  const originRef = useRef<number | null>(null);

  // Latest props/state for the (intentionally stable) PanResponder closures.
  const latest = useRef({ size, disabled, onStrokeEnd, onDrawingChange, isEmpty: strokes.length === 0 });
  latest.current = { size, disabled, onStrokeEnd, onDrawingChange, isEmpty: strokes.length === 0 };

  const sizeCallback = useRef(onSizeChange);
  sizeCallback.current = onSizeChange;

  useEffect(() => {
    if (size.width > 0 && size.height > 0) sizeCallback.current?.(size);
  }, [size]);

  const panResponder = useMemo(() => {
    const extract = (event: GestureResponderEvent): InkPoint | null => {
      const { size: canvas } = latest.current;
      if (canvas.width <= 0 || canvas.height <= 0) return null;

      const now = Date.now();
      if (originRef.current == null) originRef.current = now;

      const { locationX, locationY } = event.nativeEvent;
      return {
        x: clamp(locationX, 0, canvas.width),
        y: clamp(locationY, 0, canvas.height),
        t: now - originRef.current,
      };
    };

    const finish = () => {
      const stroke = pointsRef.current;
      pointsRef.current = [];
      setCurrent(null);
      latest.current.onDrawingChange?.(false);
      if (stroke.length > 0) latest.current.onStrokeEnd(stroke);
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => !latest.current.disabled,
      onMoveShouldSetPanResponder: () => !latest.current.disabled,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (event) => {
        if (latest.current.disabled) return;
        // New sample -> restart the clock so t is ms since the first touch.
        if (latest.current.isEmpty) originRef.current = null;

        const point = extract(event);
        if (!point) return;
        pointsRef.current = [point];
        setCurrent([point]);
        latest.current.onDrawingChange?.(true);
      },
      onPanResponderMove: (event) => {
        if (pointsRef.current.length === 0) return;
        const point = extract(event);
        if (!point) return;

        const last = pointsRef.current[pointsRef.current.length - 1];
        if (Math.abs(point.x - last.x) < 0.15 && Math.abs(point.y - last.y) < 0.15) return;

        pointsRef.current = [...pointsRef.current, point];
        setCurrent(pointsRef.current);
      },
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
    });
  }, []);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  const ink = (stroke: InkStroke, key: string) => (
    <Path
      key={key}
      d={strokeToSvgPath(stroke)}
      stroke={inkColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );

  return (
    <View
      {...panResponder.panHandlers}
      onLayout={handleLayout}
      style={[
        styles.canvas,
        { aspectRatio, maxWidth, backgroundColor: surfaceColor, borderColor: colors.accent },
        style,
      ]}
    >
      {diagram?.visible ? (
        <StrokeDiagramOverlay
          source={diagram.source}
          size={diagram.size}
          crop={diagram.crop}
          canvasWidth={size.width}
          canvasHeight={size.height}
          opacity={diagram.opacity ?? 0.3}
        />
      ) : null}

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {size.width > 0 ? (
          <Svg width={size.width} height={size.height}>
            {strokes.map((stroke, i) => ink(stroke, `s${i}`))}
            {current && current.length > 0 ? ink(current, "live") : null}
          </Svg>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: "100%",
    alignSelf: "center",
    borderWidth: 3,
    borderRadius: 12,
    overflow: "hidden",
  },
});