import { Image, StyleSheet, View, type ImageSourcePropType } from "react-native";

export interface DiagramGeometry {
  /** intrinsic size of the diagram image in px */
  size: { width: number; height: number };
  /** region of the image (source px) that should fill the canvas */
  crop: { x: number; y: number; width: number; height: number };
}

interface Props extends DiagramGeometry {
  source: ImageSourcePropType;
  canvasWidth: number;
  canvasHeight: number;
  opacity?: number;
}

/**
 * Draws a stroke-order diagram so that `crop` maps exactly onto the canvas.
 * Anything outside the crop is clipped, so the ink and the guide always agree.
 */
export default function StrokeDiagramOverlay({
  source,
  size,
  crop,
  canvasWidth,
  canvasHeight,
  opacity = 0.3,
}: Props) {
  if (canvasWidth <= 0 || canvasHeight <= 0) return null;

  const scale = Math.min(canvasWidth / crop.width, canvasHeight / crop.height);
  const left = (canvasWidth - crop.width * scale) / 2 - crop.x * scale;
  const top = (canvasHeight - crop.height * scale) / 2 - crop.y * scale;

  return (
    <View pointerEvents="none" style={[styles.clip, { opacity }]}>
      <Image
        source={source}
        resizeMode="stretch"
        style={{
          position: "absolute",
          left,
          top,
          width: size.width * scale,
          height: size.height * scale,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
});