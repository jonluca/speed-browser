import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Linking, Modal, StyleSheet, Text, TextInput, View } from "react-native";
import { Pressable, RectButton, ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/icon-symbol";
import { Toggle } from "@/components/ui/toggle";
import { useAppStore } from "@/store";
import { useAppColors } from "@/theme/colors";
import { SPEED_FUNCTIONS, type SpeedFunctionName } from "@/types/speed";
import { MAX_SPEED, MIN_SPEED, QUICK_SPEEDS, clampSpeed, formatSpeed, isHostExcluded } from "@/utils/speed-config";

const FUNCTION_LABELS: Record<SpeedFunctionName, { description: string; title: string }> = {
  requestAnimationFrame: {
    description: "Advance animation timestamps while keeping the display's native frame rate.",
    title: "Animation frames",
  },
  setInterval: {
    description: "Shorten repeating JavaScript timer intervals.",
    title: "Intervals",
  },
  setTimeout: {
    description: "Shorten one-time JavaScript timer delays.",
    title: "Timeouts",
  },
};

interface SpeedSettingsSheetProps {
  currentHost: string | null;
  onClose: () => void;
  onOpenTimerCalls: () => void;
  visible: boolean;
}

export function SpeedSettingsSheet({ currentHost, onClose, onOpenTimerCalls, visible }: SpeedSettingsSheetProps) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const config = useAppStore((state) => state.config);
  const disabledSourceCount = useAppStore((state) => state.disabledSourceKeys.length);
  const stats = useAppStore((state) => state.stats);
  const timerCallCount = useAppStore((state) => state.timerCalls.length);
  const clearBrowsingData = useAppStore((state) => state.clearBrowsingData);
  const setEnabled = useAppStore((state) => state.setEnabled);
  const setFunctionEnabled = useAppStore((state) => state.setFunctionEnabled);
  const setHostExcluded = useAppStore((state) => state.setHostExcluded);
  const setMode = useAppStore((state) => state.setMode);
  const setPauseInvocations = useAppStore((state) => state.setPauseInvocations);
  const setSpeed = useAppStore((state) => state.setSpeed);
  const resetConfig = useAppStore((state) => state.resetConfig);
  const resetStats = useAppStore((state) => state.resetStats);
  const [customSpeed, setCustomSpeed] = useState(() => config.speed.toString());

  const applyCustomSpeed = () => {
    const speed = clampSpeed(customSpeed);
    setSpeed(speed);
    setCustomSpeed(speed.toString());
  };

  const selectSpeed = (speed: number) => {
    const normalizedSpeed = clampSpeed(speed);
    setSpeed(normalizedSpeed);
    setCustomSpeed(normalizedSpeed.toString());
  };

  return (
    <Modal animationType={"slide"} onRequestClose={onClose} presentationStyle={"pageSheet"} visible={visible}>
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.header}>
          <View style={styles.headerSide} />
          <Text style={[styles.headerTitle, { color: colors.label }]}>Speed Controls</Text>
          <Pressable accessibilityRole={"button"} hitSlop={8} onPress={onClose} style={styles.doneButton}>
            <Text style={[styles.doneText, { color: colors.accent }]}>Done</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 22) + 24 }]}
          keyboardDismissMode={"interactive"}
        >
          <View style={[styles.hero, { backgroundColor: colors.card }]}>
            <View>
              <Text style={[styles.eyebrow, { color: colors.secondaryLabel }]}>PAGE SPEED</Text>
              <Text style={[styles.speedValue, { color: colors.accent }]}>
                {config.enabled ? (config.mode === "manual" ? "Manual" : formatSpeed(config.speed)) : "Off"}
              </Text>
            </View>
            <Toggle accessibilityLabel={"Enable page acceleration"} onValueChange={setEnabled} value={config.enabled} />
          </View>

          <SectionTitle text={"Mode"} />
          <View style={[styles.segmentedControl, { backgroundColor: colors.elevated }]}>
            {(["automatic", "manual"] as const).map((mode) => {
              const selected = config.mode === mode;
              return (
                <Pressable
                  accessibilityRole={"button"}
                  accessibilityState={{ selected }}
                  key={mode}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setMode(mode);
                  }}
                  style={[styles.segment, selected ? { backgroundColor: colors.card } : undefined]}
                >
                  <Text style={[styles.segmentText, { color: selected ? colors.label : colors.secondaryLabel }]}>
                    {mode === "automatic" ? "Automatic" : "Manual"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.footnote, { color: colors.secondaryLabel }]}>
            Automatic accelerates enabled APIs. Manual lets you inspect and invoke timers individually.
          </Text>

          {currentHost ? (
            <>
              <SectionTitle text={"This Website"} />
              <View style={[styles.group, { backgroundColor: colors.card }]}>
                <SettingsRow
                  detail={currentHost}
                  title={"Disable acceleration"}
                  trailing={
                    <Toggle
                      accessibilityLabel={`Disable acceleration on ${currentHost}`}
                      onValueChange={(excluded) => setHostExcluded(currentHost, excluded)}
                      value={isHostExcluded(config, currentHost)}
                    />
                  }
                />
              </View>
            </>
          ) : null}

          <SectionTitle text={"Speed"} />
          <View style={styles.speedGrid}>
            {QUICK_SPEEDS.map((speed) => {
              const selected = config.speed === speed;
              return (
                <Pressable
                  accessibilityRole={"button"}
                  accessibilityState={{ selected }}
                  key={speed}
                  onPress={() => selectSpeed(speed)}
                  style={({ pressed }) => [
                    styles.speedPreset,
                    {
                      backgroundColor: selected ? colors.accent : colors.card,
                      borderColor: selected ? colors.accent : colors.divider,
                    },
                    pressed ? styles.pressed : undefined,
                  ]}
                >
                  <Text style={[styles.speedPresetText, { color: selected ? "#FFFFFF" : colors.label }]}>
                    {formatSpeed(speed)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={[styles.customSpeed, { backgroundColor: colors.card }]}>
            <Pressable
              accessibilityLabel={"Decrease speed"}
              accessibilityRole={"button"}
              onPress={() => selectSpeed(config.speed - 0.25)}
              style={styles.stepButton}
            >
              <Text style={[styles.stepText, { color: colors.accent }]}>−</Text>
            </Pressable>
            <View style={styles.customInputWrap}>
              <TextInput
                accessibilityLabel={"Custom speed multiplier"}
                keyboardType={"decimal-pad"}
                maxLength={6}
                onBlur={applyCustomSpeed}
                onChangeText={setCustomSpeed}
                onSubmitEditing={applyCustomSpeed}
                returnKeyType={"done"}
                selectTextOnFocus={true}
                style={[styles.customInput, { color: colors.label }]}
                value={customSpeed}
              />
              <Text style={[styles.multiplier, { color: colors.secondaryLabel }]}>×</Text>
            </View>
            <Pressable
              accessibilityLabel={"Increase speed"}
              accessibilityRole={"button"}
              onPress={() => selectSpeed(config.speed + 0.25)}
              style={styles.stepButton}
            >
              <Text style={[styles.stepText, { color: colors.accent }]}>+</Text>
            </Pressable>
          </View>
          <Text style={[styles.footnote, { color: colors.secondaryLabel }]}>
            From {MIN_SPEED}× to {MAX_SPEED}× in 0.25× steps. Some sites may behave unexpectedly at very high speeds.
          </Text>

          <SectionTitle text={"Accelerated APIs"} />
          <View style={[styles.group, { backgroundColor: colors.card }]}>
            {SPEED_FUNCTIONS.map((functionName, index) => {
              const copy = FUNCTION_LABELS[functionName];
              return (
                <View
                  key={functionName}
                  style={
                    index > 0 ? { borderColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth } : undefined
                  }
                >
                  <SettingsRow
                    detail={`${copy.description} ${stats[functionName].toLocaleString()} triggers this session.`}
                    title={copy.title}
                    trailing={
                      <Toggle
                        accessibilityLabel={`Accelerate ${copy.title.toLowerCase()}`}
                        onValueChange={(enabled) => setFunctionEnabled(functionName, enabled)}
                        value={config.enabledFunctions[functionName]}
                      />
                    }
                  />
                </View>
              );
            })}
          </View>

          {config.mode === "manual" ? (
            <>
              <SectionTitle text={"Manual Timer Control"} />
              <View style={[styles.group, { backgroundColor: colors.card }]}>
                <SettingsRow
                  detail={"Hold managed timeouts and intervals until you invoke them."}
                  title={"Pause invocations"}
                  trailing={
                    <Toggle
                      accessibilityLabel={"Pause timer invocations"}
                      onValueChange={setPauseInvocations}
                      value={config.pauseInvocations}
                    />
                  }
                />
                <View style={{ borderColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth }}>
                  <RectButton onPress={onOpenTimerCalls} style={styles.timerButton}>
                    <View accessibilityRole={"button"} style={styles.timerButtonContent}>
                      <View style={styles.timerButtonLabel}>
                        <IconSymbol color={colors.accent} name={"timer"} size={20} />
                        <Text style={[styles.timerButtonText, { color: colors.label }]}>Active timers</Text>
                      </View>
                      <View style={styles.timerButtonLabel}>
                        <Text style={[styles.timerCount, { color: colors.secondaryLabel }]}>
                          {timerCallCount}
                          {disabledSourceCount > 0 ? ` · ${disabledSourceCount} blocked` : ""}
                        </Text>
                        <IconSymbol color={colors.tertiaryLabel} name={"chevron.forward"} size={13} />
                      </View>
                    </View>
                  </RectButton>
                </View>
              </View>
            </>
          ) : null}

          <SectionTitle text={"Privacy & Support"} />
          <View style={[styles.group, { backgroundColor: colors.card }]}>
            <LinkRow
              onPress={() => void Linking.openURL("https://jonluca.github.io/speed-browser/privacy.html")}
              title={"Privacy Policy"}
            />
            <View style={{ borderColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth }}>
              <LinkRow
                onPress={() => void Linking.openURL("https://jonluca.github.io/speed-browser/support.html")}
                title={"Support"}
              />
            </View>
          </View>

          <SectionTitle text={"Reset"} />
          <View style={[styles.group, { backgroundColor: colors.card }]}>
            <RectButton onPress={resetStats} style={styles.resetButton}>
              <Text style={[styles.resetText, { color: colors.accent }]}>Reset session counters</Text>
            </RectButton>
            <View style={{ borderColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth }}>
              <RectButton
                onPress={() => {
                  resetConfig();
                  setCustomSpeed("2");
                }}
                style={styles.resetButton}
              >
                <Text style={[styles.resetText, { color: colors.danger }]}>Restore default settings</Text>
              </RectButton>
            </View>
            <View style={{ borderColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth }}>
              <RectButton onPress={clearBrowsingData} style={styles.resetButton}>
                <Text style={[styles.resetText, { color: colors.danger }]}>Clear browsing data</Text>
              </RectButton>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function SectionTitle({ text }: { text: string }) {
  const colors = useAppColors();
  return <Text style={[styles.sectionTitle, { color: colors.secondaryLabel }]}>{text.toUpperCase()}</Text>;
}

function SettingsRow({ detail, title, trailing }: { detail: string; title: string; trailing: React.ReactNode }) {
  const colors = useAppColors();
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.label }]}>{title}</Text>
        <Text style={[styles.rowDetail, { color: colors.secondaryLabel }]}>{detail}</Text>
      </View>
      {trailing}
    </View>
  );
}

function LinkRow({ onPress, title }: { onPress: () => void; title: string }) {
  const colors = useAppColors();
  return (
    <RectButton onPress={onPress} style={styles.linkButton}>
      <View accessibilityRole={"link"} style={styles.linkButtonContent}>
        <Text style={[styles.linkButtonText, { color: colors.label }]}>{title}</Text>
        <IconSymbol color={colors.tertiaryLabel} name={"chevron.forward"} size={13} />
      </View>
    </RectButton>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
  },
  customInput: {
    fontSize: 23,
    fontWeight: "700",
    minWidth: 56,
    padding: 0,
    textAlign: "right",
  },
  customInputWrap: {
    alignItems: "baseline",
    flexDirection: "row",
  },
  customSpeed: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    height: 56,
    justifyContent: "space-between",
  },
  doneButton: {
    alignItems: "flex-end",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 64,
  },
  doneText: {
    fontSize: 17,
    fontWeight: "600",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.7,
  },
  footnote: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 6,
    marginHorizontal: 14,
    marginTop: 8,
  },
  group: {
    borderRadius: 14,
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    height: 48,
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerSide: {
    width: 64,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  hero: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    minHeight: 86,
    paddingHorizontal: 18,
  },
  linkButton: {
    backgroundColor: "transparent",
  },
  linkButtonContent: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 50,
    paddingHorizontal: 16,
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  multiplier: {
    fontSize: 18,
    marginLeft: 3,
  },
  pressed: {
    opacity: 0.6,
  },
  resetButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  resetText: {
    fontSize: 16,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    minHeight: 70,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rowDetail: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  screen: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.35,
    marginBottom: 7,
    marginLeft: 14,
    marginTop: 24,
  },
  segment: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    height: 34,
    justifyContent: "center",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
  },
  segmentedControl: {
    borderRadius: 10,
    flexDirection: "row",
    gap: 2,
    padding: 2,
  },
  speedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 9,
  },
  speedPreset: {
    alignItems: "center",
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    height: 43,
    justifyContent: "center",
    width: "23%",
  },
  speedPresetText: {
    fontSize: 15,
    fontWeight: "600",
  },
  speedValue: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.8,
    marginTop: 1,
  },
  stepButton: {
    alignItems: "center",
    height: 56,
    justifyContent: "center",
    width: 62,
  },
  stepText: {
    fontSize: 30,
    fontWeight: "300",
  },
  timerButton: {
    backgroundColor: "transparent",
  },
  timerButtonContent: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 54,
    paddingHorizontal: 16,
  },
  timerButtonLabel: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  timerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  timerCount: {
    fontSize: 13,
  },
});
