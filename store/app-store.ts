import AsyncStorage from "expo-sqlite/kv-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AccelerationType, SpeedConfig, SpeedStats, TimerCall } from "@/types/speed";
import {
  DEFAULT_SPEED_CONFIG,
  EMPTY_SPEED_STATS,
  clampAccelerationSpeed,
  normalizeSpeedConfig,
  setHostExcluded,
} from "@/utils/speed-config";

interface AppStore {
  config: SpeedConfig;
  disabledSourceKeys: string[];
  hasHydrated: boolean;
  hiddenSourceKeys: string[];
  recentUrls: string[];
  stats: SpeedStats;
  timerCalls: TimerCall[];
  addRecentUrl: (url: string) => void;
  clearBrowsingData: () => void;
  resetConfig: () => void;
  resetStats: () => void;
  setConfig: (config: SpeedConfig) => void;
  setEnabled: (enabled: boolean) => void;
  setAccelerationEnabled: (name: AccelerationType, enabled: boolean) => void;
  setAccelerationSpeed: (name: AccelerationType, speed: number) => void;
  setHasHydrated: (hydrated: boolean) => void;
  setHostExcluded: (host: string, excluded: boolean) => void;
  setMode: (mode: SpeedConfig["mode"]) => void;
  setPauseInvocations: (paused: boolean) => void;
  setStats: (stats: Partial<SpeedStats>) => void;
  setTimerCalls: (calls: TimerCall[]) => void;
  toggleDisabledSource: (sourceKey: string, disabled: boolean) => void;
  toggleHiddenSource: (sourceKey: string, hidden: boolean) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      config: DEFAULT_SPEED_CONFIG,
      disabledSourceKeys: [],
      hasHydrated: false,
      hiddenSourceKeys: [],
      recentUrls: [],
      stats: EMPTY_SPEED_STATS,
      timerCalls: [],
      addRecentUrl: (url) =>
        set((state) => ({
          recentUrls: [url, ...state.recentUrls.filter((item) => item !== url)].slice(0, 8),
        })),
      clearBrowsingData: () =>
        set({
          disabledSourceKeys: [],
          hiddenSourceKeys: [],
          recentUrls: [],
          stats: EMPTY_SPEED_STATS,
          timerCalls: [],
        }),
      resetConfig: () => set({ config: DEFAULT_SPEED_CONFIG, disabledSourceKeys: [], hiddenSourceKeys: [] }),
      resetStats: () => set({ stats: EMPTY_SPEED_STATS }),
      setConfig: (config) => set({ config }),
      setEnabled: (enabled) => set((state) => ({ config: { ...state.config, enabled } })),
      setAccelerationEnabled: (name, enabled) =>
        set((state) => ({
          config: {
            ...state.config,
            accelerations: {
              ...state.config.accelerations,
              [name]: { ...state.config.accelerations[name], enabled },
            },
          },
        })),
      setAccelerationSpeed: (name, speed) =>
        set((state) => ({
          config: {
            ...state.config,
            accelerations: {
              ...state.config.accelerations,
              [name]: { ...state.config.accelerations[name], speed: clampAccelerationSpeed(name, speed) },
            },
          },
        })),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setHostExcluded: (host, excluded) => set((state) => ({ config: setHostExcluded(state.config, host, excluded) })),
      setMode: (mode) =>
        set((state) => ({
          config: {
            ...state.config,
            mode,
            pauseInvocations: mode === "manual" ? state.config.pauseInvocations : false,
          },
        })),
      setPauseInvocations: (pauseInvocations) => set((state) => ({ config: { ...state.config, pauseInvocations } })),
      setStats: (stats) =>
        set((state) => ({
          stats: {
            mediaPlayback: state.stats.mediaPlayback + (stats.mediaPlayback ?? 0),
            requestAnimationFrame: state.stats.requestAnimationFrame + (stats.requestAnimationFrame ?? 0),
            setInterval: state.stats.setInterval + (stats.setInterval ?? 0),
            setTimeout: state.stats.setTimeout + (stats.setTimeout ?? 0),
            webAnimations: state.stats.webAnimations + (stats.webAnimations ?? 0),
          },
        })),
      setTimerCalls: (timerCalls) => set({ timerCalls }),
      toggleDisabledSource: (sourceKey, disabled) =>
        set((state) => ({
          disabledSourceKeys: disabled
            ? Array.from(new Set([...state.disabledSourceKeys, sourceKey])).sort()
            : state.disabledSourceKeys.filter((key) => key !== sourceKey),
        })),
      toggleHiddenSource: (sourceKey, hidden) =>
        set((state) => ({
          hiddenSourceKeys: hidden
            ? Array.from(new Set([...state.hiddenSourceKeys, sourceKey])).sort()
            : state.hiddenSourceKeys.filter((key) => key !== sourceKey),
        })),
    }),
    {
      name: __DEV__ ? "speed-browser-store-dev" : "speed-browser-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        config: state.config,
        disabledSourceKeys: state.disabledSourceKeys,
        hiddenSourceKeys: state.hiddenSourceKeys,
        recentUrls: state.recentUrls,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AppStore>;
        return {
          ...current,
          ...saved,
          config: normalizeSpeedConfig(saved.config),
        };
      },
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);

export const useSpeedConfig = () => useAppStore((state) => state.config);
export const useHasHydrated = () => useAppStore((state) => state.hasHydrated);
export const useTimerCalls = () => useAppStore((state) => state.timerCalls);
export const useSpeedStats = () => useAppStore((state) => state.stats);
