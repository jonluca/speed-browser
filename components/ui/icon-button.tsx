import * as Haptics from "expo-haptics";
import { Pressable } from "react-native-gesture-handler";
import { StyleSheet, View } from "react-native";

import { IconSymbol, type IconSymbolName } from "@/components/icon-symbol";

interface IconButtonProps {
  accessibilityLabel: string;
  color: string;
  disabled?: boolean;
  name: IconSymbolName;
  onPress: () => void;
  selected?: boolean;
  size?: number;
}

export function IconButton({
  accessibilityLabel,
  color,
  disabled = false,
  name,
  onPress,
  selected = false,
  size = 23,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={"button"}
      disabled={disabled}
      hitSlop={8}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        selected ? styles.selected : undefined,
        disabled ? styles.disabled : undefined,
        pressed ? styles.pressed : undefined,
      ]}
    >
      <View pointerEvents={"none"}>
        <IconSymbol color={color} name={name} size={size} weight={"semibold"} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  disabled: {
    opacity: 0.28,
  },
  pressed: {
    opacity: 0.5,
    transform: [{ scale: 0.96 }],
  },
  selected: {
    backgroundColor: "rgba(0, 122, 255, 0.13)",
  },
});
