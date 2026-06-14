import { BlurView } from "expo-blur";
import { useEffect, useRef, useState } from "react";
import { Keyboard, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/icon-symbol";
import { IconButton } from "@/components/ui/icon-button";
import type { SpeedConfig } from "@/types/speed";
import { useAppColors } from "@/theme/colors";
import { formatSpeed, getHostname, isHostExcluded, normalizeUrl } from "@/utils/speed-config";

interface BrowserToolbarProps {
  addressFocusRequest: number;
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
  progress: number;
}

export function BrowserToolbar({
  addressFocusRequest,
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
  progress,
}: BrowserToolbarProps) {
  const colors = useAppColors();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [draft, setDraft] = useState(currentUrl ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const host = getHostname(currentUrl);
  const isSecureUrl = currentUrl?.toLowerCase().startsWith("https://") ?? false;
  const isInsecureUrl = currentUrl?.toLowerCase().startsWith("http://") ?? false;
  const speedActive = config.enabled && !isHostExcluded(config, host);
  const statusLabel = !config.enabled
    ? "Off"
    : isHostExcluded(config, host)
      ? "Site off"
      : config.mode === "manual"
        ? config.pauseInvocations
          ? "Paused"
          : "Manual"
        : formatSpeed(config.speed);

  useEffect(() => {
    if (addressFocusRequest > 0) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [addressFocusRequest]);

  const submit = () => {
    const target = normalizeUrl(draft);
    if (!target) {
      return;
    }
    Keyboard.dismiss();
    setIsEditing(false);
    onNavigate(target);
  };

  return (
    <View pointerEvents={"box-none"} style={styles.container}>
      <BlurView
        intensity={80}
        style={[styles.chrome, { paddingBottom: Math.max(insets.bottom, 8) }]}
        tint={colorScheme === "dark" ? "dark" : "systemChromeMaterial"}
      >
        {isLoading ? (
          <View style={[styles.progressTrack, { backgroundColor: colors.divider }]}>
            <View
              style={[styles.progress, { backgroundColor: colors.accent, width: `${Math.max(4, progress * 100)}%` }]}
            />
          </View>
        ) : null}

        <View style={[styles.addressBar, { backgroundColor: colors.elevated }]}>
          <View style={styles.addressLeading}>
            <IconSymbol
              color={isInsecureUrl ? colors.danger : colors.secondaryLabel}
              name={
                isSecureUrl
                  ? "lock.fill"
                  : isInsecureUrl
                    ? "exclamationmark.triangle.fill"
                    : currentUrl
                      ? "globe.americas.fill"
                      : "magnifyingglass"
              }
              size={13}
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
              requestAnimationFrame(() => inputRef.current?.setSelection(0, (currentUrl ?? "").length));
            }}
            onSubmitEditing={submit}
            placeholder={"Search or enter website"}
            placeholderTextColor={colors.secondaryLabel}
            ref={inputRef}
            returnKeyType={"go"}
            selectTextOnFocus={true}
            style={[styles.addressInput, { color: colors.label }]}
            value={isEditing ? draft : (host ?? "Search or enter website")}
          />
          {!isEditing && currentUrl ? (
            <IconButton
              accessibilityLabel={isLoading ? "Stop loading" : "Reload page"}
              color={colors.secondaryLabel}
              name={"arrow.clockwise"}
              onPress={onReload}
              size={15}
            />
          ) : null}
          {!isEditing ? (
            <Pressable
              accessibilityLabel={`Speed controls, ${statusLabel}`}
              accessibilityRole={"button"}
              onPress={onSettings}
              style={({ pressed }) => [
                styles.speedBadge,
                { backgroundColor: speedActive ? colors.accent : colors.tertiaryLabel },
                pressed ? styles.pressed : undefined,
              ]}
            >
              <IconSymbol color={"#FFFFFF"} name={"bolt.fill"} size={11} />
              <Text style={styles.speedBadgeText}>{statusLabel}</Text>
            </Pressable>
          ) : null}
        </View>

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
          <IconButton accessibilityLabel={"Start page"} color={colors.accent} name={"house.fill"} onPress={onHome} />
          <IconButton
            accessibilityLabel={"Speed settings"}
            color={colors.accent}
            name={"slider.horizontal.3"}
            onPress={onSettings}
          />
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  addressBar: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    height: 46,
    marginHorizontal: 10,
    overflow: "hidden",
    paddingLeft: 11,
    paddingRight: 4,
  },
  addressInput: {
    flex: 1,
    fontSize: 15,
    height: 46,
    paddingHorizontal: 8,
    paddingVertical: 0,
    textAlign: "center",
  },
  addressLeading: {
    alignItems: "center",
    justifyContent: "center",
    width: 18,
  },
  chrome: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
    paddingTop: 10,
  },
  container: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
  },
  navigationRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingTop: 2,
  },
  pressed: {
    opacity: 0.6,
  },
  progress: {
    borderRadius: 1,
    height: 2,
  },
  progressTrack: {
    height: 2,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  speedBadge: {
    alignItems: "center",
    borderRadius: 11,
    flexDirection: "row",
    gap: 2,
    height: 24,
    justifyContent: "center",
    minWidth: 49,
    paddingHorizontal: 7,
  },
  speedBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});
