import * as Haptics from "expo-haptics";
import { StyleSheet, View } from "react-native";
import { Pressable } from "react-native-gesture-handler";

import { useAppColors } from "@/theme/colors";

interface ToggleProps {
  accessibilityLabel: string;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
  value: boolean;
}

export function Toggle({ accessibilityLabel, disabled = false, onValueChange, value }: ToggleProps) {
  const colors = useAppColors();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={"switch"}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => {
        void Haptics.selectionAsync();
        onValueChange(!value);
      }}
      style={[
        styles.track,
        { backgroundColor: value ? colors.accent : colors.tertiaryLabel },
        disabled ? styles.disabled : undefined,
      ]}
    >
      <View style={[styles.thumb, { transform: [{ translateX: value ? 20 : 0 }] }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.45,
  },
  thumb: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    height: 22,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.25)",
    width: 22,
  },
  track: {
    borderRadius: 15,
    height: 28,
    justifyContent: "center",
    paddingHorizontal: 3,
    width: 48,
  },
});
