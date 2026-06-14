import {
  SPEED_FUNCTIONS,
  type SpeedConfig,
  type SpeedFunctionName,
  type SpeedFunctionSettings,
  type SpeedStats,
} from "@/types/speed";

export const MIN_SPEED = 1;
export const MAX_SPEED = 100;
export const SPEED_STEP = 0.25;
export const QUICK_SPEEDS = [1, 1.5, 2, 3, 4, 8, 16] as const;

export const DEFAULT_SPEED_CONFIG: SpeedConfig = {
  enabled: true,
  enabledFunctions: {
    requestAnimationFrame: false,
    setInterval: true,
    setTimeout: true,
  },
  excludedHosts: [],
  mode: "automatic",
  pauseInvocations: false,
  speed: 2,
};

export const EMPTY_SPEED_STATS: SpeedStats = {
  requestAnimationFrame: 0,
  setInterval: 0,
  setTimeout: 0,
};

export function clampSpeed(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_SPEED_CONFIG.speed;
  }

  const stepped = Math.round(parsed / SPEED_STEP) * SPEED_STEP;
  return Math.min(MAX_SPEED, Math.max(MIN_SPEED, stepped));
}

export function formatSpeed(speed: number): string {
  const rounded = Math.round(speed * 100) / 100;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded}x`;
}

export function getHostname(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isHostExcluded(config: SpeedConfig, host: string | null | undefined): boolean {
  if (!host) {
    return false;
  }

  return config.excludedHosts.includes(host.toLowerCase());
}

export function setHostExcluded(config: SpeedConfig, host: string, excluded: boolean): SpeedConfig {
  const normalizedHost = host.trim().toLowerCase();
  const hosts = new Set(config.excludedHosts);

  if (excluded) {
    hosts.add(normalizedHost);
  } else {
    hosts.delete(normalizedHost);
  }

  return { ...config, excludedHosts: Array.from(hosts).sort() };
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(trimmed)) {
    return `http://${trimmed}`;
  }

  if (/^[\w-]+(?:\.[\w-]+)+(?:[/:?#].*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

export function normalizeFunctionSettings(value: unknown): SpeedFunctionSettings {
  const source = isRecord(value) ? value : {};

  return SPEED_FUNCTIONS.reduce<SpeedFunctionSettings>(
    (settings, name) => {
      settings[name] = typeof source[name] === "boolean" ? source[name] : DEFAULT_SPEED_CONFIG.enabledFunctions[name];
      return settings;
    },
    { ...DEFAULT_SPEED_CONFIG.enabledFunctions },
  );
}

export function normalizeSpeedConfig(value: unknown): SpeedConfig {
  const config = isRecord(value) ? value : {};
  const mode = config.mode === "manual" ? "manual" : "automatic";

  return {
    enabled: typeof config.enabled === "boolean" ? config.enabled : DEFAULT_SPEED_CONFIG.enabled,
    enabledFunctions: normalizeFunctionSettings(config.enabledFunctions),
    excludedHosts: Array.isArray(config.excludedHosts)
      ? Array.from(
          new Set(
            config.excludedHosts.flatMap((host) => {
              if (typeof host !== "string") {
                return [];
              }
              const normalizedHost = host.trim().toLowerCase();
              return normalizedHost ? [normalizedHost] : [];
            }),
          ),
        ).sort()
      : [],
    mode,
    pauseInvocations: mode === "manual" && config.pauseInvocations === true,
    speed: clampSpeed(config.speed),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object";
}

export function isSpeedFunctionName(value: string): value is SpeedFunctionName {
  return SPEED_FUNCTIONS.includes(value as SpeedFunctionName);
}
