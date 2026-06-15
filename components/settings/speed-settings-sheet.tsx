import {
  Button,
  Form,
  Host,
  HStack,
  LabeledContent,
  Link,
  Picker,
  Section,
  Spacer,
  Stepper,
  Text,
  Toggle,
  VStack,
} from "@expo/ui/swift-ui";
import {
  accessibilityHint,
  accessibilityLabel,
  accessibilityValue,
  bold,
  buttonStyle,
  font,
  foregroundStyle,
  frame,
  listSectionSpacing,
  monospacedDigit,
  padding,
  pickerStyle,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { Fragment } from "react";
import { Alert, Modal, StyleSheet, useColorScheme } from "react-native";

import { useAppStore } from "@/store";
import { useAppColors } from "@/theme/colors";
import { ACCELERATION_TYPES, type AccelerationType } from "@/types/speed";
import { MAX_SPEED, MIN_SPEED, QUICK_SPEEDS, formatSpeed, isHostExcluded } from "@/utils/speed-config";

const ACCELERATION_COPY: Record<AccelerationType, { description: string; title: string }> = {
  mediaPlayback: {
    description: "Audio and video playback",
    title: "Audio & video",
  },
  requestAnimationFrame: {
    description: "Frame timestamps",
    title: "Animation frames",
  },
  setInterval: {
    description: "Repeating JavaScript timers",
    title: "Intervals",
  },
  setTimeout: {
    description: "One-time JavaScript timers",
    title: "Timeouts",
  },
  webAnimations: {
    description: "CSS and Web Animations",
    title: "Web animations",
  },
};

const SPEED_SCALE = 4;

interface SpeedSettingsSheetProps {
  currentHost: string | null;
  onClose: () => void;
  onOpenTimerCalls: () => void;
  visible: boolean;
}

export function SpeedSettingsSheet({ currentHost, onClose, onOpenTimerCalls, visible }: SpeedSettingsSheetProps) {
  const colors = useAppColors();
  const systemColorScheme = useColorScheme();
  const colorScheme = systemColorScheme === "dark" ? "dark" : "light";
  const config = useAppStore((state) => state.config);
  const disabledSourceCount = useAppStore((state) => state.disabledSourceKeys.length);
  const stats = useAppStore((state) => state.stats);
  const timerCallCount = useAppStore((state) => state.timerCalls.length);
  const clearBrowsingData = useAppStore((state) => state.clearBrowsingData);
  const setEnabled = useAppStore((state) => state.setEnabled);
  const setAccelerationEnabled = useAppStore((state) => state.setAccelerationEnabled);
  const setAccelerationSpeed = useAppStore((state) => state.setAccelerationSpeed);
  const setHostExcluded = useAppStore((state) => state.setHostExcluded);
  const setMode = useAppStore((state) => state.setMode);
  const setPauseInvocations = useAppStore((state) => state.setPauseInvocations);
  const resetConfig = useAppStore((state) => state.resetConfig);
  const resetStats = useAppStore((state) => state.resetStats);

  const activeAccelerations = ACCELERATION_TYPES.filter((type) => config.accelerations[type].enabled);
  const activeSpeeds = new Set(activeAccelerations.map((type) => config.accelerations[type].speed));
  const status = !config.enabled
    ? "Off"
    : activeAccelerations.length === 0
      ? "No types enabled"
      : config.mode === "manual"
        ? "Manual timers"
        : activeSpeeds.size === 1
          ? formatSpeed(config.accelerations[activeAccelerations[0]].speed)
          : "Mixed speeds";

  const confirmResetStats = () => {
    Alert.alert("Reset session counters?", "Timer trigger counts for this browsing session will return to zero.", [
      { style: "cancel", text: "Cancel" },
      { onPress: resetStats, style: "destructive", text: "Reset" },
    ]);
  };

  const confirmResetConfig = () => {
    Alert.alert(
      "Restore default settings?",
      "Speeds, mode, website exclusions, and acceleration types will be reset.",
      [
        { style: "cancel", text: "Cancel" },
        { onPress: resetConfig, style: "destructive", text: "Restore Defaults" },
      ],
    );
  };

  const confirmClearBrowsingData = () => {
    Alert.alert(
      "Clear browsing data?",
      "Recent addresses, timer activity, blocked sources, and session counters will be removed.",
      [
        { style: "cancel", text: "Cancel" },
        { onPress: clearBrowsingData, style: "destructive", text: "Clear Data" },
      ],
    );
  };

  return (
    <Modal animationType={"slide"} onRequestClose={onClose} presentationStyle={"pageSheet"} visible={visible}>
      <Host
        colorScheme={colorScheme}
        style={[styles.host, { backgroundColor: colors.background }]}
        useViewportSizeMeasurement={true}
      >
        <VStack spacing={0}>
          <HStack
            alignment={"center"}
            modifiers={[frame({ maxWidth: Infinity, minHeight: 52 }), padding({ horizontal: 20 })]}
          >
            <Text modifiers={[font({ textStyle: "headline", weight: "semibold" })]}>Speed Controls</Text>
            <Spacer />
            <Button
              label={"Done"}
              modifiers={[
                buttonStyle("glass"),
                tint(colors.accent),
                accessibilityLabel("Close speed controls"),
                accessibilityHint("Returns to the browser"),
              ]}
              onPress={onClose}
            />
          </HStack>

          <Form modifiers={[listSectionSpacing("compact")]}>
            <Section title={"Page Acceleration"}>
              <Toggle
                isOn={config.enabled}
                label={"Enable acceleration"}
                modifiers={[accessibilityHint("Speeds up enabled timers, animations, and media on webpages")]}
                onIsOnChange={setEnabled}
                systemImage={"bolt.fill"}
              />
              <LabeledContent label={"Status"}>
                <Text modifiers={[bold(), monospacedDigit()]}>{status}</Text>
              </LabeledContent>
            </Section>

            <Section
              footer={<Text>Manual mode lets you inspect timers. Animation and media speeds still apply.</Text>}
              title={"Mode"}
            >
              <Picker
                label={"Timer mode"}
                modifiers={[
                  pickerStyle("segmented"),
                  accessibilityLabel("Timer mode"),
                  accessibilityValue(config.mode === "automatic" ? "Automatic" : "Manual"),
                ]}
                onSelectionChange={setMode}
                selection={config.mode}
              >
                <Text modifiers={[tag("automatic")]}>Automatic</Text>
                <Text modifiers={[tag("manual")]}>Manual</Text>
              </Picker>
            </Section>

            {currentHost ? (
              <Section
                footer={<Text>Leave this off to use your global acceleration settings on this website.</Text>}
                title={"This Website"}
              >
                <Toggle
                  isOn={isHostExcluded(config, currentHost)}
                  modifiers={[
                    accessibilityLabel(`Disable acceleration on ${currentHost}`),
                    accessibilityHint("Adds or removes this website from the excluded websites list"),
                  ]}
                  onIsOnChange={(excluded) => setHostExcluded(currentHost, excluded)}
                >
                  <Text>Disable acceleration</Text>
                  <Text modifiers={[foregroundStyle({ style: "secondary", type: "hierarchical" })]}>{currentHost}</Text>
                </Toggle>
              </Section>
            ) : null}

            <Section
              footer={
                <Text>
                  Set each type independently from {MIN_SPEED}× to {MAX_SPEED}×. Media playback tops out at 16×.
                </Text>
              }
              title={"Acceleration Types"}
            >
              {ACCELERATION_TYPES.map((accelerationType) => {
                const acceleration = config.accelerations[accelerationType];
                const copy = ACCELERATION_COPY[accelerationType];
                const eventCount = stats[accelerationType].toLocaleString();
                const eventLabel = `${eventCount} ${eventCount === "1" ? "event" : "events"}`;
                const maxSpeed = accelerationType === "mediaPlayback" ? 16 : MAX_SPEED;
                const speedOptions = QUICK_SPEEDS.includes(acceleration.speed as (typeof QUICK_SPEEDS)[number])
                  ? QUICK_SPEEDS
                  : [acceleration.speed, ...QUICK_SPEEDS];

                return (
                  <Fragment key={accelerationType}>
                    <Toggle
                      isOn={acceleration.enabled}
                      modifiers={[
                        accessibilityLabel(`Accelerate ${copy.title.toLowerCase()}`),
                        accessibilityHint(copy.description),
                        accessibilityValue(`${eventLabel} this session`),
                      ]}
                      onIsOnChange={(enabled) => setAccelerationEnabled(accelerationType, enabled)}
                    >
                      <Text>{copy.title}</Text>
                      <Text modifiers={[foregroundStyle({ style: "secondary", type: "hierarchical" })]}>
                        {copy.description} · {eventLabel}
                      </Text>
                    </Toggle>
                    {acceleration.enabled ? (
                      <>
                        <Stepper
                          label={`Speed · ${formatSpeed(acceleration.speed)}`}
                          max={maxSpeed * SPEED_SCALE}
                          min={MIN_SPEED * SPEED_SCALE}
                          modifiers={[
                            accessibilityLabel(`${copy.title} speed multiplier`),
                            accessibilityValue(formatSpeed(acceleration.speed)),
                            accessibilityHint("Adjusts this acceleration type in quarter-step increments"),
                          ]}
                          onValueChange={(value) => setAccelerationSpeed(accelerationType, value / SPEED_SCALE)}
                          step={1}
                          value={Math.round(acceleration.speed * SPEED_SCALE)}
                        />
                        <Picker
                          label={"Quick preset"}
                          modifiers={[pickerStyle("menu"), accessibilityLabel(`${copy.title} speed preset`)]}
                          onSelectionChange={(speed) => setAccelerationSpeed(accelerationType, speed)}
                          selection={acceleration.speed}
                        >
                          {speedOptions.map((speed) => (
                            <Text key={speed} modifiers={[tag(speed)]}>
                              {formatSpeed(speed)}
                            </Text>
                          ))}
                        </Picker>
                      </>
                    ) : null}
                  </Fragment>
                );
              })}
            </Section>

            {config.mode === "manual" ? (
              <Section title={"Manual Timer Control"}>
                <Toggle
                  isOn={config.pauseInvocations}
                  modifiers={[
                    accessibilityLabel("Pause timer invocations"),
                    accessibilityHint("Holds managed timeouts and intervals until you invoke them"),
                  ]}
                  onIsOnChange={setPauseInvocations}
                >
                  <Text>Pause invocations</Text>
                  <Text modifiers={[foregroundStyle({ style: "secondary", type: "hierarchical" })]}>
                    Hold timers until you invoke them.
                  </Text>
                </Toggle>
                <LabeledContent label={"Timer activity"}>
                  <Text modifiers={[monospacedDigit()]}>
                    {timerCallCount} active{disabledSourceCount > 0 ? ` · ${disabledSourceCount} blocked` : ""}
                  </Text>
                </LabeledContent>
                <Button
                  label={"Review Active Timers"}
                  modifiers={[accessibilityHint("Opens the list of detected webpage timers"), tint(colors.accent)]}
                  onPress={onOpenTimerCalls}
                  systemImage={"timer"}
                />
              </Section>
            ) : null}

            <Section title={"Privacy & Support"}>
              <Link
                destination={"https://jonluca.github.io/speed-browser/privacy.html"}
                label={"Privacy Policy"}
                modifiers={[accessibilityHint("Opens the privacy policy in the browser")]}
              />
              <Link
                destination={"https://jonluca.github.io/speed-browser/support.html"}
                label={"Support"}
                modifiers={[accessibilityHint("Opens Speed Browser support")]}
              />
            </Section>

            <Section
              footer={<Text>Browsing data includes recent addresses and timer activity stored on this device.</Text>}
              title={"Reset"}
            >
              <Button
                label={"Reset Session Counters"}
                modifiers={[accessibilityHint("Asks before resetting timer trigger counts")]}
                onPress={confirmResetStats}
                systemImage={"arrow.counterclockwise"}
              />
              <Button
                label={"Restore Default Settings"}
                modifiers={[accessibilityHint("Asks before resetting all speed settings")]}
                onPress={confirmResetConfig}
                role={"destructive"}
                systemImage={"gearshape.arrow.triangle.2.circlepath"}
              />
              <Button
                label={"Clear Browsing Data"}
                modifiers={[accessibilityHint("Asks before clearing local browsing data")]}
                onPress={confirmClearBrowsingData}
                role={"destructive"}
                systemImage={"trash"}
              />
            </Section>
          </Form>
        </VStack>
      </Host>
    </Modal>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
