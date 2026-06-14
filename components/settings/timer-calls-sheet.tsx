import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { Pressable, RectButton, ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/icon-symbol";
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

  return (
    <Modal animationType={"slide"} onRequestClose={onClose} presentationStyle={"pageSheet"} visible={visible}>
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.header}>
          <View style={styles.headerSide} />
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.label }]}>Active Timers</Text>
            <Text style={[styles.headerSubtitle, { color: colors.secondaryLabel }]}> {calls.length} tracked</Text>
          </View>
          <Pressable accessibilityRole={"button"} hitSlop={8} onPress={onClose} style={styles.doneButton}>
            <Text style={[styles.doneText, { color: colors.accent }]}>Done</Text>
          </Pressable>
        </View>

        <View style={[styles.segmented, { backgroundColor: colors.elevated }]}>
          {(["duration", "recent"] as const).map((mode) => (
            <Pressable
              accessibilityRole={"button"}
              accessibilityState={{ selected: sortMode === mode }}
              key={mode}
              onPress={() => setSortMode(mode)}
              style={[styles.segment, sortMode === mode ? { backgroundColor: colors.card } : undefined]}
            >
              <Text style={[styles.segmentText, { color: sortMode === mode ? colors.label : colors.secondaryLabel }]}>
                {mode === "duration" ? "Longest delay" : "Newest"}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 24 }]}>
          {visibleCalls.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.accentMuted }]}>
                <IconSymbol color={colors.accent} name={"timer"} size={28} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.label }]}>No active timers</Text>
              <Text style={[styles.emptyBody, { color: colors.secondaryLabel }]}>
                Browse a page in Manual mode. JavaScript timeouts and intervals will appear here as the page creates
                them.
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
                  <RectButton key={key} onPress={() => toggleHiddenSource(key, false)} style={styles.sourceButton}>
                    <View
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
                      <Text style={[styles.sourceAction, { color: colors.accent }]}>Show</Text>
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
                  <RectButton key={key} onPress={() => toggleDisabledSource(key, false)} style={styles.sourceButton}>
                    <View
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
                      <Text style={[styles.sourceAction, { color: colors.accent }]}>Allow</Text>
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
        <Pressable
          accessibilityLabel={"Hide timer source"}
          accessibilityRole={"button"}
          onPress={onHide}
          style={styles.hideButton}
        >
          <Text style={[styles.hideText, { color: colors.secondaryLabel }]}>Hide</Text>
        </Pressable>
      </View>

      <View style={styles.metrics}>
        <Metric label={"remaining"} value={formatDuration(remainingMs)} />
        <Metric label={"delay"} value={formatDuration(call.delay)} />
        <Metric label={"speed"} value={`${call.speed}×`} />
      </View>

      <View style={styles.actions}>
        <ActionButton color={colors.danger} label={"Disable once"} onPress={() => onCommand("disable", call)} />
        <ActionButton color={colors.danger} label={"Block source"} onPress={() => onCommand("disable-source", call)} />
        <ActionButton
          color={colors.accent}
          label={"Invoke now"}
          onPress={() => onCommand("invoke", call)}
          primary={true}
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
      <Text style={[styles.metricLabel, { color: colors.secondaryLabel }]}>{label}</Text>
    </View>
  );
}

function ActionButton({
  color,
  label,
  onPress,
  primary = false,
}: {
  color: string;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={"button"}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: primary ? color : "transparent", borderColor: color },
        pressed ? styles.pressed : undefined,
      ]}
    >
      <Text style={[styles.actionText, { color: primary ? "#FFFFFF" : color }]}>{label}</Text>
    </Pressable>
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
  action: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    justifyContent: "center",
    minHeight: 39,
    paddingHorizontal: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 7,
  },
  card: {
    borderRadius: 15,
    marginBottom: 10,
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
    padding: 16,
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
    paddingVertical: 58,
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
    flexDirection: "row",
    height: 50,
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
    minHeight: 30,
    paddingHorizontal: 4,
  },
  hideText: {
    fontSize: 12,
    fontWeight: "600",
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    marginTop: 1,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  metrics: {
    flexDirection: "row",
    marginVertical: 14,
  },
  pressed: {
    opacity: 0.55,
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
    height: 32,
    justifyContent: "center",
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
    marginTop: 8,
    padding: 2,
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
