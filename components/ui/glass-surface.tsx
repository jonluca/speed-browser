import { GlassView, isLiquidGlassAvailable, type GlassStyle } from "expo-glass-effect";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

const LIQUID_GLASS_AVAILABLE = isLiquidGlassAvailable();

interface GlassSurfaceProps {
  children: ReactNode;
  fallbackColor: string;
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: Exclude<GlassStyle, "none">;
}

export function GlassSurface({
  children,
  fallbackColor,
  interactive = false,
  style,
  variant = "regular",
}: GlassSurfaceProps) {
  return (
    <GlassView
      glassEffectStyle={LIQUID_GLASS_AVAILABLE ? variant : "none"}
      isInteractive={interactive}
      style={[{ backgroundColor: LIQUID_GLASS_AVAILABLE ? "transparent" : fallbackColor }, style]}
    >
      {children}
    </GlassView>
  );
}

export const hasLiquidGlass = LIQUID_GLASS_AVAILABLE;
