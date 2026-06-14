import { useColorScheme } from "react-native";

export interface AppColors {
  accent: string;
  accentMuted: string;
  background: string;
  card: string;
  chrome: string;
  danger: string;
  divider: string;
  elevated: string;
  label: string;
  secondaryLabel: string;
  tertiaryLabel: string;
}

const lightColors: AppColors = {
  accent: "#007AFF",
  accentMuted: "#E5F1FF",
  background: "#F2F2F7",
  card: "#FFFFFF",
  chrome: "rgba(248, 248, 248, 0.82)",
  danger: "#FF3B30",
  divider: "rgba(60, 60, 67, 0.18)",
  elevated: "#E9E9EE",
  label: "#000000",
  secondaryLabel: "rgba(60, 60, 67, 0.72)",
  tertiaryLabel: "rgba(60, 60, 67, 0.42)",
};

const darkColors: AppColors = {
  accent: "#0A84FF",
  accentMuted: "#102A44",
  background: "#000000",
  card: "#1C1C1E",
  chrome: "rgba(28, 28, 30, 0.86)",
  danger: "#FF453A",
  divider: "rgba(84, 84, 88, 0.58)",
  elevated: "#2C2C2E",
  label: "#FFFFFF",
  secondaryLabel: "rgba(235, 235, 245, 0.68)",
  tertiaryLabel: "rgba(235, 235, 245, 0.34)",
};

export function useAppColors(): AppColors {
  const colorScheme = useColorScheme();
  return colorScheme === "dark" ? darkColors : lightColors;
}
