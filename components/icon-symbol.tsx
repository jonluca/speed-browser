import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps } from "react";
import type { StyleProp, TextStyle } from "react-native";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];
export type IconSymbolName = string;

export interface IconSymbolProps {
  color: string;
  name: IconSymbolName;
  size?: number;
  style?: StyleProp<TextStyle>;
  weight?: string;
}

const ICONS: Record<string, MaterialIconName> = {
  "arrow.clockwise": "refresh",
  "bolt.slash.fill": "flash-off",
  "book.closed.fill": "menu-book",
  "chevron.backward": "arrow-back-ios-new",
  "chevron.forward": "arrow-forward-ios",
  "chevron.left.forwardslash.chevron.right": "code",
  "doc.on.clipboard": "content-copy",
  "exclamationmark.triangle.fill": "warning",
  "gearshape.fill": "settings",
  "globe.americas.fill": "public",
  globe: "public",
  "hand.raised.fill": "front-hand",
  house: "home",
  "house.fill": "home",
  link: "link",
  "lock.fill": "lock",
  magnifyingglass: "search",
  "newspaper.fill": "newspaper",
  "paperplane.fill": "send",
  "pause.fill": "pause",
  "play.fill": "play-arrow",
  "slider.horizontal.3": "tune",
  "square.and.arrow.up": "ios-share",
  timer: "timer",
  xmark: "close",
  "xmark.circle.fill": "cancel",
  "bolt.fill": "bolt",
};

export function IconSymbol({ color, name, size = 22, style }: IconSymbolProps) {
  return <MaterialIcons color={color} name={ICONS[name] ?? "help-outline"} size={size} style={style} />;
}
