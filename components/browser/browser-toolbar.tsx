import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import { Keyboard, StyleSheet, Text, TextInput, View } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/icon-symbol";
import { GlassSurface } from "@/components/ui/glass-surface";
import { IconButton } from "@/components/ui/icon-button";
import { useAppColors } from "@/theme/colors";
import { ACCELERATION_TYPES, type SpeedConfig } from "@/types/speed";
import { formatSpeed, getHostname, isHostExcluded, normalizeUrl } from "@/utils/speed-config";

interface BrowserToolbarProps {
  canGoBack: boolean;
  canGoForward: boolean;
  config: SpeedConfig;
  currentUrl: string | null;
  isLoading: boolean;
  onBack: () => void;
  onForward: () => void;
  onHome: () => void;
  onNavigate: (url: string) => void;
  onReload: () => void;
  onSettings: () => void;
  onShare: () => void;
  onStop: () => void;
  progress: number;
}

export function BrowserToolbar({
  canGoBack,
  canGoForward,
  config,
  currentUrl,
  isLoading,
  onBack,
  onForward,
  onHome,
  onNavigate,
  onReload,
  onSettings,
  onShare,
  onStop,
  progress,
}: BrowserToolbarProps) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [draft, setDraft] = useState(currentUrl ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const host = getHostname(currentUrl);
  const isSecureUrl = currentUrl?.toLowerCase().startsWith("https://") ?? false;
  const isInsecureUrl = currentUrl?.toLowerCase().startsWith("http://") ?? false;
  const activeAccelerations = ACCELERATION_TYPES.filter((type) => config.accelerations[type].enabled);
  const activeSpeeds = new Set(activeAccelerations.map((type) => config.accelerations[type].speed));
  const speedActive = config.enabled && !isHostExcluded(config, host) && activeAccelerations.length > 0;
  const speedLabel = !config.enabled
    ? "Off"
    : isHostExcluded(config, host)
      ? "Site off"
      : activeAccelerations.length === 0
        ? "None"
        : config.mode === "manual"
          ? config.pauseInvocations
            ? "Paused"
            : "Manual"
          : activeSpeeds.size === 1
            ? formatSpeed(config.accelerations[activeAccelerations[0]].speed).replace("x", "×")
            : "Mixed";

  const submit = () => {
    const target = normalizeUrl(draft);
    if (!target) {
      return;
    }
    Keyboard.dismiss();
    setIsEditing(false);
    onNavigate(target);
  };

  const stopEditing = () => {
    setDraft(currentUrl ?? "");
    setIsEditing(false);
    Keyboard.dismiss();
  };

  return (
    <View pointerEvents={"box-none"} style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.addressRow}>
        <GlassSurface
          fallbackColor={colors.chrome}
          style={[styles.addressSurface, { borderColor: colors.glassStroke }]}
        >
          <View style={styles.addressContent}>
            <View style={styles.addressLeading}>
              <IconSymbol
                color={isInsecureUrl ? colors.danger : colors.secondaryLabel}
                name={
                  isSecureUrl
                    ? "lock.fill"
                    : isInsecureUrl
                      ? "exclamationmark.triangle.fill"
                      : currentUrl
                        ? "globe"
                        : "magnifyingglass"
                }
                size={13}
                weight={"semibold"}
              />
            </View>
            <TextInput
              accessibilityLabel={"Address"}
              autoCapitalize={"none"}
              autoCorrect={false}
              clearButtonMode={"while-editing"}
              keyboardType={"web-search"}
              onBlur={() => setIsEditing(false)}
              onChangeText={setDraft}
              onFocus={() => {
                setIsEditing(true);
                setDraft(currentUrl ?? "");
              }}
              onSubmitEditing={submit}
              placeholder={"Search or enter website"}
              placeholderTextColor={colors.secondaryLabel}
              ref={inputRef}
              returnKeyType={"go"}
              selectTextOnFocus={true}
              style={[styles.addressInput, { color: colors.label }, isEditing ? styles.addressInputEditing : undefined]}
              value={isEditing ? draft : (host ?? "Search or enter website")}
            />
            {!isEditing && currentUrl ? (
              <IconButton
                accessibilityLabel={isLoading ? "Stop loading" : "Reload page"}
                color={colors.secondaryLabel}
                name={isLoading ? "xmark" : "arrow.clockwise"}
                onPress={isLoading ? onStop : onReload}
                size={15}
              />
            ) : (
              <View style={styles.addressTrailingSpacer} />
            )}
          </View>
          {isLoading ? (
            <View style={[styles.progressTrack, { backgroundColor: colors.glassFill }]}>
              <View
                style={[styles.progress, { backgroundColor: colors.accent, width: `${Math.max(6, progress * 100)}%` }]}
              />
            </View>
          ) : null}
        </GlassSurface>

        {isEditing ? (
          <Pressable accessibilityRole={"button"} onPress={stopEditing} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: colors.accent }]}>Cancel</Text>
          </Pressable>
        ) : (
          <GlassSurface
            fallbackColor={colors.chrome}
            interactive={true}
            style={[styles.speedSurface, { borderColor: colors.glassStroke }]}
          >
            <Pressable
              accessibilityLabel={`Speed controls, ${speedLabel}`}
              accessibilityRole={"button"}
              onPress={() => {
                void Haptics.selectionAsync();
                onSettings();
              }}
              style={({ pressed }) => [styles.speedButton, pressed ? styles.pressed : undefined]}
            >
              <IconSymbol
                color={speedActive ? colors.accent : colors.secondaryLabel}
                name={speedActive ? "bolt.fill" : "bolt.slash.fill"}
                size={14}
                weight={"semibold"}
              />
              <Text style={[styles.speedText, { color: speedActive ? colors.accent : colors.secondaryLabel }]}>
                {speedLabel}
              </Text>
            </Pressable>
          </GlassSurface>
        )}
      </View>

      {!isEditing ? (
        <GlassSurface
          fallbackColor={colors.chrome}
          style={[styles.navigationSurface, { borderColor: colors.glassStroke }]}
        >
          <View style={styles.navigationRow}>
            <IconButton
              accessibilityLabel={"Back"}
              color={colors.accent}
              disabled={!canGoBack}
              name={"chevron.backward"}
              onPress={onBack}
            />
            <IconButton
              accessibilityLabel={"Forward"}
              color={colors.accent}
              disabled={!canGoForward}
              name={"chevron.forward"}
              onPress={onForward}
            />
            <IconButton
              accessibilityLabel={"Share"}
              color={colors.accent}
              disabled={!currentUrl}
              name={"square.and.arrow.up"}
              onPress={onShare}
            />
            <IconButton
              accessibilityLabel={"Start page"}
              color={colors.accent}
              name={currentUrl ? "house" : "house.fill"}
              onPress={onHome}
              selected={!currentUrl}
            />
          </View>
        </GlassSurface>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  addressContent: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    minHeight: 50,
  },
  addressInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    height: 50,
    letterSpacing: -0.1,
    paddingHorizontal: 6,
    paddingVertical: 0,
    textAlign: "center",
  },
  addressInputEditing: {
    fontWeight: "400",
    textAlign: "left",
  },
  addressLeading: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 13,
    width: 24,
  },
  addressRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  addressSurface: {
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minHeight: 52,
    overflow: "hidden",
  },
  addressTrailingSpacer: {
    marginRight: 8,
    width: 36,
  },
  cancelButton: {
    alignItems: "center",
    height: 52,
    justifyContent: "center",
    paddingHorizontal: 7,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  container: {
    bottom: 0,
    gap: 8,
    left: 0,
    paddingHorizontal: 12,
    position: "absolute",
    right: 0,
  },
  navigationRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 9,
  },
  navigationSurface: {
    alignSelf: "center",
    borderRadius: 27,
    borderWidth: StyleSheet.hairlineWidth,
    height: 52,
    overflow: "hidden",
    width: 252,
  },
  pressed: {
    opacity: 0.58,
    transform: [{ scale: 0.96 }],
  },
  progress: {
    borderRadius: 1,
    height: 2,
  },
  progressTrack: {
    bottom: 0,
    height: 2,
    left: 16,
    position: "absolute",
    right: 16,
  },
  speedButton: {
    alignItems: "center",
    flex: 1,
    gap: 2,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  speedSurface: {
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    height: 52,
    overflow: "hidden",
    width: 68,
  },
  speedText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: -0.1,
    maxWidth: 56,
  },
});
