import * as Linking from "expo-linking";
import { randomUUID } from "expo-crypto";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Alert, Share, StyleSheet, Text, View } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from "react-native-webview";

import { BrowserToolbar } from "@/components/browser/browser-toolbar";
import { StartPage } from "@/components/browser/start-page";
import { SpeedSettingsSheet } from "@/components/settings/speed-settings-sheet";
import { TimerCallsSheet } from "@/components/settings/timer-calls-sheet";
import { GlassSurface } from "@/components/ui/glass-surface";
import { buildConfigUpdateScript, buildSpeedInjectionScript, buildTimerCommandScript } from "@/services/speed-script";
import { useAppStore } from "@/store";
import { useAppColors } from "@/theme/colors";
import type { SpeedStats, TimerCall, TimerCommand } from "@/types/speed";
import { getHostname } from "@/utils/speed-config";

interface BrowserNavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  title: string;
}

interface ShouldStartLoadRequest extends WebViewNavigation {
  isTopFrame: boolean;
}

const MAX_BRIDGE_MESSAGE_LENGTH = 128 * 1024;
const MAX_STAT_INCREMENT = 1_000_000;
const MAX_TIMER_CALLS = 250;
const MAX_TIMER_STRING_LENGTH = 2_048;
const SAFE_EXTERNAL_SCHEMES = new Set(["mailto", "sms", "tel"]);
const BRIDGE_TOKEN = randomUUID();

const INITIAL_NAVIGATION_STATE: BrowserNavigationState = {
  canGoBack: false,
  canGoForward: false,
  isLoading: false,
  title: "Speed Browser",
};

function handleShouldStartLoad(request: ShouldStartLoadRequest) {
  if (/^https?:\/\//i.test(request.url) || request.url === "about:blank") {
    return true;
  }

  const scheme = getUrlScheme(request.url);
  const isUserInitiatedTopFrame = request.isTopFrame && request.navigationType === "click";
  if (!scheme || !SAFE_EXTERNAL_SCHEMES.has(scheme) || !isUserInitiatedTopFrame) {
    return false;
  }

  void Linking.openURL(request.url).catch(() => {
    Alert.alert("Cannot Open Link", request.url);
  });
  return false;
}

export function BrowserScreen() {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const config = useAppStore((state) => state.config);
  const disabledSourceKeys = useAppStore((state) => state.disabledSourceKeys);
  const recentUrls = useAppStore((state) => state.recentUrls);
  const addRecentUrl = useAppStore((state) => state.addRecentUrl);
  const setStats = useAppStore((state) => state.setStats);
  const setTimerCalls = useAppStore((state) => state.setTimerCalls);
  const toggleDisabledSource = useAppStore((state) => state.toggleDisabledSource);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [navigation, setNavigation] = useState(INITIAL_NAVIGATION_STATE);
  const [progress, setProgress] = useState(0);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [timerCallsVisible, setTimerCallsVisible] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const injectionScript = buildSpeedInjectionScript({ bridgeToken: BRIDGE_TOKEN, config, disabledSourceKeys });

  useEffect(() => {
    if (!sourceUrl) {
      return;
    }
    webViewRef.current?.injectJavaScript(buildConfigUpdateScript(config, disabledSourceKeys));
  }, [config, disabledSourceKeys, sourceUrl]);

  const navigate = (url: string) => {
    setPageError(null);
    setCurrentUrl(url);
    setSourceUrl(url);
    setNavigation((state) => ({ ...state, isLoading: true }));
  };

  const goHome = () => {
    setSourceUrl(null);
    setCurrentUrl(null);
    setPageError(null);
    setProgress(0);
    setTimerCalls([]);
    setNavigation(INITIAL_NAVIGATION_STATE);
  };

  const handleNavigationChange = (state: WebViewNavigation) => {
    if (/^https?:\/\//i.test(state.url)) {
      setCurrentUrl(state.url);
      if (!state.loading) {
        addRecentUrl(state.url);
      }
    }
    setNavigation({
      canGoBack: state.canGoBack,
      canGoForward: state.canGoForward,
      isLoading: state.loading,
      title: state.title || getHostname(state.url) || "Speed Browser",
    });
    if (!state.loading) {
      setProgress(1);
    }
  };

  const handleBridgeMessage = (event: WebViewMessageEvent) => {
    const data = event.nativeEvent.data;
    if (data.length > MAX_BRIDGE_MESSAGE_LENGTH) {
      return;
    }

    let message: unknown;
    try {
      message = JSON.parse(data) as unknown;
    } catch {
      return;
    }

    if (!isRecord(message)) {
      return;
    }

    if (message.bridgeToken !== BRIDGE_TOKEN) {
      return;
    }

    if (message.type === "speed-browser:calls" && Array.isArray(message.calls)) {
      const calls = message.calls.slice(0, MAX_TIMER_CALLS);
      if (!calls.every(isTimerCall)) {
        return;
      }
      setTimerCalls(calls);
      return;
    }

    if (message.type === "speed-browser:stats" && isSpeedStats(message.stats)) {
      setStats(message.stats);
    }
  };

  const handleTimerCommand = (command: TimerCommand, call: TimerCall) => {
    if (command === "disable-source") {
      toggleDisabledSource(call.sourceKey, true);
    }
    webViewRef.current?.injectJavaScript(buildTimerCommandScript(command, call.id, call.sourceKey));
  };

  const shareCurrentPage = () => {
    if (!currentUrl) {
      return;
    }
    void Share.share({ message: currentUrl, title: navigation.title });
  };

  const toolbar = (
    <BrowserToolbar
      canGoBack={navigation.canGoBack}
      canGoForward={navigation.canGoForward}
      config={config}
      currentUrl={currentUrl}
      isLoading={navigation.isLoading}
      onBack={() => webViewRef.current?.goBack()}
      onForward={() => webViewRef.current?.goForward()}
      onHome={goHome}
      onNavigate={navigate}
      onReload={() => webViewRef.current?.reload()}
      onSettings={() => setSettingsVisible(true)}
      onShare={shareCurrentPage}
      onStop={() => webViewRef.current?.stopLoading()}
      progress={progress}
    />
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar style={colors.label === "#FFFFFF" ? "light" : "dark"} />
      {sourceUrl ? (
        <WebView
          allowsBackForwardNavigationGestures={true}
          allowsInlineMediaPlayback={true}
          applicationNameForUserAgent={"SpeedBrowser/1.0"}
          automaticallyAdjustContentInsets={false}
          contentInset={{ bottom: 148, left: 0, right: 0, top: 0 }}
          decelerationRate={"normal"}
          injectedJavaScriptBeforeContentLoaded={injectionScript}
          injectedJavaScriptBeforeContentLoadedForMainFrameOnly={true}
          injectedJavaScriptForMainFrameOnly={true}
          javaScriptCanOpenWindowsAutomatically={false}
          javaScriptEnabled={true}
          onContentProcessDidTerminate={() => webViewRef.current?.reload()}
          onError={(event) => {
            setPageError(event.nativeEvent.description);
            setNavigation((state) => ({ ...state, isLoading: false }));
          }}
          onLoadProgress={(event) => setProgress(event.nativeEvent.progress)}
          onMessage={handleBridgeMessage}
          onNavigationStateChange={handleNavigationChange}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          originWhitelist={["*"]}
          pullToRefreshEnabled={true}
          ref={webViewRef}
          setSupportMultipleWindows={false}
          sharedCookiesEnabled={true}
          source={{ uri: sourceUrl }}
          startInLoadingState={true}
          style={styles.webView}
        />
      ) : (
        <StartPage onNavigate={navigate} recentUrls={recentUrls} />
      )}

      {pageError ? (
        <GlassSurface fallbackColor={colors.card} style={[styles.errorCard, { borderColor: colors.glassStroke }]}>
          <Text style={[styles.errorTitle, { color: colors.label }]}>This page couldn’t load.</Text>
          <Text style={[styles.errorDetail, { color: colors.secondaryLabel }]}>{pageError}</Text>
          <Pressable
            accessibilityRole={"button"}
            onPress={() => {
              setPageError(null);
              webViewRef.current?.reload();
            }}
            style={[styles.retryButton, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </GlassSurface>
      ) : null}

      {toolbar}

      <SpeedSettingsSheet
        currentHost={getHostname(currentUrl)}
        onClose={() => setSettingsVisible(false)}
        onOpenTimerCalls={() => {
          setSettingsVisible(false);
          setTimerCallsVisible(true);
        }}
        visible={settingsVisible}
      />
      <TimerCallsSheet
        onClose={() => {
          setTimerCallsVisible(false);
          setSettingsVisible(true);
        }}
        onCommand={handleTimerCommand}
        visible={timerCallsVisible}
      />
    </View>
  );
}

function isSpeedStats(value: unknown): value is Partial<SpeedStats> {
  if (!isRecord(value)) {
    return false;
  }

  const keys = Object.keys(value);
  return (
    keys.every((key) => key === "requestAnimationFrame" || key === "setInterval" || key === "setTimeout") &&
    Object.values(value).every(isStatIncrement)
  );
}

function isStatIncrement(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_STAT_INCREMENT;
}

function isTimerCall(value: unknown): value is TimerCall {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isFiniteNumber(value.addedAt) &&
    isFiniteNumber(value.delay) &&
    isFiniteNumber(value.dueAt) &&
    (value.functionName === "setInterval" || value.functionName === "setTimeout") &&
    isBoundedString(value.handlerLabel) &&
    isBoundedString(value.id) &&
    typeof value.publicId === "number" &&
    Number.isInteger(value.publicId) &&
    isFiniteNumber(value.remainingMs) &&
    isBoundedString(value.sourceKey) &&
    isBoundedString(value.sourceLabel) &&
    isFiniteNumber(value.speed) &&
    (value.type === "interval" || value.type === "timeout") &&
    isBoundedString(value.url)
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBoundedString(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_TIMER_STRING_LENGTH;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function getUrlScheme(url: string): string | null {
  const match = /^([a-z][a-z\d+.-]*):/i.exec(url);
  return match?.[1]?.toLowerCase() ?? null;
}

const styles = StyleSheet.create({
  errorCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    left: 24,
    padding: 20,
    position: "absolute",
    right: 24,
    top: "28%",
  },
  errorDetail: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  errorTitle: {
    fontSize: 19,
    fontWeight: "700",
  },
  retryButton: {
    alignItems: "center",
    borderRadius: 10,
    height: 42,
    justifyContent: "center",
    marginTop: 16,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  screen: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
});
