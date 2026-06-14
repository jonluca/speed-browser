import { SymbolView, type SymbolViewProps, type SymbolWeight } from "expo-symbols";
import type { StyleProp, ViewStyle } from "react-native";

export type IconSymbolName = SymbolViewProps["name"];

export interface IconSymbolProps {
  color: string;
  name: IconSymbolName;
  size?: number;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}

export function IconSymbol({ color, name, size = 22, style, weight = "regular" }: IconSymbolProps) {
  return (
    <SymbolView
      name={name}
      resizeMode={"scaleAspectFit"}
      style={[{ height: size, width: size }, style]}
      tintColor={color}
      type={"hierarchical"}
      weight={weight}
    />
  );
}
