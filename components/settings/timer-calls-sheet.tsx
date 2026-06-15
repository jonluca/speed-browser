import { useEffect, useState } from "react";
import { Alert, Modal, StyleSheet, Text, View } from "react-native";
import { Pressable, RectButton, ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/icon-symbol";
import { GlassSurface } from "@/components/ui/glass-surface";
import { useAppStore } from "@/store";
import { useAppColors } from "@/theme/colors";
import type { TimerCall, TimerCommand } from "@/types/speed";

type SortMode = "duration" | "recent";

interface TimerCallsSheetProps {
  onClose: () => void;
  onCommand: (command: TimerCommand, call: TimerCall) => void;
  visible: boolean;
}

export function TimerCallsSheet({ onClose, onCommand, visible }: TimerCallsSheetProps) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const calls = useAppStore((state) => state.timerCalls);
  const disabledSourceKeys = useAppStore((state) => state.disabledSourceKeys);
  const hiddenSourceKeys = useAppStore((state) => state.hiddenSourceKeys);
  const toggleDisabledSource = useAppStore((state) => state.toggleDisabledSource);
  const toggleHiddenSource = useAppStore((state) => state.toggleHiddenSource);
  const [sortMode, setSortMode] = useState<SortMode>("duration");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!visible) {
      return;
    }
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [visible]);

  const visibleCalls = calls
    .filter((call) => !hiddenSourceKeys.includes(call.sourceKey))
    .sort((left, right) =>
      sortMode === "recent" ? right.addedAt - left.addedAt : right.delay - left.delay || right.addedAt - left.addedAt,
    );
  const allCallsHidden = calls.length > 0 && visibleCalls.length === 0;
  const trackedLabel = calls.length === 1 ? "1 timer tracked" : `${calls.length} timers tracked`;
  const headerSubtitle =
    visibleCalls.length === calls.length ? trackedLabel : `${visibleCalls.length} visible · ${trackedLabel}`;

  return (
    <Modal animationType={"slide"} onRequestClose={onClose} presentationStyle={"pageSheet"} visible={visible}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <GlassSurface fallbackColor={colors.chrome} style={[styles.header, { borderBottomColor: colors.divider }]}>
          <View style={styles.headerSide} />
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.label }]}>Active Timers</Text>
            <Text style={[styles.headerSubtitle, { color: colors.secondaryLabel }]}>{headerSubtitle}</Text>
          </View>
          <Pressable
            accessibilityHint={"Closes active timers"}
            accessibilityRole={"button"}
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [styles.doneButton, pressed ? styles.pressed : undefined]}
          >
            <Text style={[styles.doneText, { color: colors.accent }]}>Done</Text>
          </Pressable>
        </GlassSurface>

        <View
          accessibilityLabel={"Timer sorting"}
          accessibilityRole={"tablist"}
          style={[styles.segmented, { backgroundColor: colors.elevated }]}
        >
          {(["duration", "recent"] as const).map((mode) => (
            <Pressable
              accessibilityLabel={mode === "duration" ? "Sort by longest delay" : "Sort by newest"}
              accessibilityRole={"tab"}
              accessibilityState={{ selected: sortMode === mode }}
              key={mode}
              onPress={() => setSortMode(mode)}
              style={({ pressed }) => [
                styles.segment,
                sortMode === mode ? { backgroundColor: colors.card } : undefined,
                pressed ? styles.segmentPressed : undefined,
              ]}
            >
              <Text style={[styles.segmentText, { color: sortMode === mode ? colors.label : colors.secondaryLabel }]}>
                {mode === "duration" ? "Longest Delay" : "Newest First"}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
          contentInsetAdjustmentBehavior={"automatic"}
        >
          {visibleCalls.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.accentMuted }]}>
                <IconSymbol color={colors.accent} name={"timer"} size={28} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.label }]}>
                {allCallsHidden ? "All timers hidden" : "No active timers"}
              </Text>
              <Text style={[styles.emptyBody, { color: colors.secondaryLabel }]}>
                {allCallsHidden
                  ? "All active timer sources are hidden. Restore one below to show its timers again."
                  : "Browse a page in Manual mode. JavaScript timeouts and intervals will appear here as the page creates them."}
              </Text>
            </View>
          ) : (
            visibleCalls.map((call) => (
              <TimerCard
                call={call}
                key={call.id}
                now={now}
                onCommand={onCommand}
                onHide={() => toggleHiddenSource(call.sourceKey, true)}
              />
            ))
          )}

          {hiddenSourceKeys.length > 0 ? (
            <View style={styles.sourceSection}>
              <Text style={[styles.sectionTitle, { color: colors.secondaryLabel }]}>HIDDEN SOURCES</Text>
              <View style={[styles.sourceGroup, { backgroundColor: colors.card }]}>
                {hiddenSourceKeys.map((key, index) => (
                  <RectButton
                    key={key}
                    onPress={() => toggleHiddenSource(key, false)}
                    style={styles.sourceButton}
                    underlayColor={colors.elevated}
                  >
                    <View
                      accessibilityHint={"Restores timers from this source to the active list"}
                      accessibilityLabel={`Show ${key}`}
                      accessibilityRole={"button"}
                      style={[
                        styles.sourceRow,
                        index > 0
                          ? { borderColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth }
                          : undefined,
                      ]}
                    >
                      <Text numberOfLines={1} style={[styles.sourceText, { color: colors.label }]}>
                        {key}
                      </Text>
                      <View style={styles.sourceActionWrap}>
                        <Text style={[styles.sourceAction, { color: colors.accent }]}>Show</Text>
                        <IconSymbol color={colors.tertiaryLabel} name={"chevron.forward"} size={14} />
                      </View>
                    </View>
                  </RectButton>
                ))}
              </View>
            </View>
          ) : null}

          {disabledSourceKeys.length > 0 ? (
            <View style={styles.sourceSection}>
              <Text style={[styles.sectionTitle, { color: colors.secondaryLabel }]}>BLOCKED SOURCES</Text>
              <View style={[styles.sourceGroup, { backgroundColor: colors.card }]}>
                {disabledSourceKeys.map((key, index) => (
                  <RectButton
                    key={key}
                    onPress={() => toggleDisabledSource(key, false)}
                    style={styles.sourceButton}
                    underlayColor={colors.elevated}
                  >
                    <View
                      accessibilityHint={"Allows future timers from this source"}
                      accessibilityLabel={`Allow ${key}`}
                      accessibilityRole={"button"}
                      style={[
                        styles.sourceRow,
                        index > 0
                          ? { borderColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth }
                          : undefined,
                      ]}
                    >
                      <Text numberOfLines={1} style={[styles.sourceText, { color: colors.label }]}>
                        {key}
                      </Text>
                      <View style={styles.sourceActionWrap}>
                        <Text style={[styles.sourceAction, { color: colors.accent }]}>Allow</Text>
                        <IconSymbol color={colors.tertiaryLabel} name={"chevron.forward"} size={14} />
                      </View>
                    </View>
                  </RectButton>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function TimerCard({
  call,
  now,
  onCommand,
  onHide,
}: {
  call: TimerCall;
  now: number;
  onCommand: (command: TimerCommand, call: TimerCall) => void;
  onHide: () => void;
}) {
  const colors = useAppColors();
  const remainingMs = Math.max(0, call.dueAt - now);

  const confirmBlockSource = () => {
    Alert.alert(
      "Block This Source?",
      `Future timers from ${call.sourceLabel} will be blocked until you allow the source again.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Block Source", style: "destructive", onPress: () => onCommand("disable-source", call) },
      ],
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleWrap}>
          <Text style={[styles.functionName, { color: colors.label }]}>{call.functionName}</Text>
          <Text numberOfLines={1} style={[styles.handler, { color: colors.secondaryLabel }]}>
            {call.handlerLabel}
          </Text>
          <Text numberOfLines={1} style={[styles.source, { color: colors.tertiaryLabel }]}>
            {call.sourceLabel}
          </Text>
        </View>
        <RectButton
          accessibilityLabel={"Hide timer source"}
          onPress={onHide}
          style={styles.hideButton}
          underlayColor={colors.elevated}
        >
          <View accessibilityRole={"button"} style={styles.hideButtonContent}>
            <Text style={[styles.hideText, { color: colors.secondaryLabel }]}>Hide</Text>
          </View>
        </RectButton>
      </View>

      <View style={[styles.metrics, { backgroundColor: colors.background }]}>
        <Metric label={"remaining"} value={formatDuration(remainingMs)} />
        <View style={[styles.metricDivider, { backgroundColor: colors.divider }]} />
        <Metric label={"delay"} value={formatDuration(call.delay)} />
        <View style={[styles.metricDivider, { backgroundColor: colors.divider }]} />
        <Metric label={"speed"} value={`${call.speed}×`} />
      </View>

      <RectButton
        onPress={() => onCommand("invoke", call)}
        style={[styles.primaryAction, { backgroundColor: colors.accent }]}
        underlayColor={colors.accent}
      >
        <View
          accessibilityHint={"Runs this timer immediately"}
          accessibilityLabel={"Invoke timer now"}
          accessibilityRole={"button"}
          style={styles.primaryActionContent}
        >
          <IconSymbol color={"#FFFFFF"} name={"bolt.fill"} size={18} />
          <Text style={styles.primaryActionText}>Invoke Now</Text>
        </View>
      </RectButton>

      <View style={[styles.secondaryActions, { borderColor: colors.divider }]}>
        <TimerActionRow
          color={colors.danger}
          hint={"Prevents this occurrence from running"}
          icon={"xmark.circle.fill"}
          label={"Disable This Timer"}
          onPress={() => onCommand("disable", call)}
        />
        <View style={[styles.actionDivider, { backgroundColor: colors.divider }]} />
        <TimerActionRow
          color={colors.danger}
          hint={"Asks for confirmation before blocking future timers from this source"}
          icon={"exclamationmark.triangle.fill"}
          label={"Block Source…"}
          onPress={confirmBlockSource}
        />
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const colors = useAppColors();
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color: colors.label }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.secondaryLabel }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

function TimerActionRow({
  color,
  hint,
  icon,
  label,
  onPress,
}: {
  color: string;
  hint: string;
  icon: string;
  label: string;
  onPress: () => void;
}) {
  const colors = useAppColors();

  return (
    <RectButton onPress={onPress} style={styles.actionRowButton} underlayColor={colors.elevated}>
      <View accessibilityHint={hint} accessibilityRole={"button"} style={styles.actionRow}>
        <IconSymbol color={color} name={icon} size={18} />
        <Text style={[styles.actionRowText, { color }]}>{label}</Text>
        <IconSymbol color={colors.tertiaryLabel} name={"chevron.forward"} size={14} />
      </View>
    </RectButton>
  );
}

function formatDuration(milliseconds: number): string {
  if (milliseconds < 1_000) {
    return `${Math.ceil(milliseconds)}ms`;
  }
  if (milliseconds < 60_000) {
    return `${(milliseconds / 1_000).toFixed(milliseconds < 10_000 ? 1 : 0)}s`;
  }
  const minutes = Math.floor(milliseconds / 60_000);
  const seconds = Math.round((milliseconds % 60_000) / 1_000);
  return `${minutes}m ${seconds}s`;
}

const styles = StyleSheet.create({
  actionDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 46,
  },
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 47,
    paddingHorizontal: 14,
  },
  actionRowButton: {
    backgroundColor: "transparent",
  },
  actionRowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  card: {
    borderRadius: 15,
    marginBottom: 12,
    overflow: "hidden",
    padding: 14,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardTitleWrap: {
    flex: 1,
    paddingRight: 10,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
  empty: {
    alignItems: "center",
    paddingHorizontal: 34,
    paddingVertical: 44,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
    textAlign: "center",
  },
  emptyIcon: {
    alignItems: "center",
    borderRadius: 30,
    height: 60,
    justifyContent: "center",
    marginBottom: 14,
    width: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  functionName: {
    fontFamily: "Courier",
    fontSize: 14,
    fontWeight: "700",
  },
  handler: {
    fontSize: 12,
    marginTop: 3,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    height: 54,
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerSide: {
    width: 64,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  headerTitleWrap: {
    alignItems: "center",
  },
  hideButton: {
    backgroundColor: "transparent",
    borderRadius: 8,
    overflow: "hidden",
  },
  hideButtonContent: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
    minWidth: 48,
  },
  hideText: {
    fontSize: 12,
    fontWeight: "600",
  },
  metric: {
    alignItems: "center",
    flex: 1,
  },
  metricDivider: {
    height: 28,
    width: StyleSheet.hairlineWidth,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 0.35,
    marginTop: 2,
  },
  metricValue: {
    fontSize: 15,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
  },
  metrics: {
    alignItems: "center",
    borderRadius: 11,
    flexDirection: "row",
    marginBottom: 12,
    marginTop: 13,
    minHeight: 55,
  },
  pressed: {
    opacity: 0.55,
  },
  primaryAction: {
    borderRadius: 11,
    overflow: "hidden",
  },
  primaryActionContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 14,
  },
  primaryActionText: {
    color: "#FFFFFF",
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
  },
  segment: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    height: 30,
    justifyContent: "center",
  },
  segmentPressed: {
    opacity: 0.65,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
  },
  segmented: {
    borderRadius: 10,
    flexDirection: "row",
    gap: 2,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 2,
  },
  secondaryActions: {
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
    overflow: "hidden",
  },
  source: {
    fontFamily: "Courier",
    fontSize: 10,
    marginTop: 3,
  },
  sourceAction: {
    fontSize: 15,
    fontWeight: "600",
  },
  sourceActionWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  sourceButton: {
    backgroundColor: "transparent",
  },
  sourceGroup: {
    borderRadius: 14,
    overflow: "hidden",
  },
  sourceRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    marginLeft: 14,
    minHeight: 48,
    paddingRight: 14,
  },
  sourceSection: {
    marginTop: 24,
  },
  sourceText: {
    flex: 1,
    fontFamily: "Courier",
    fontSize: 11,
  },
});
