import {
  ACCELERATION_TYPES,
  type AccelerationSettings,
  type AccelerationType,
  type SpeedConfig,
  type SpeedStats,
} from "@/types/speed";

export const MIN_SPEED = 1;
export const MAX_SPEED = 100;
export const SPEED_STEP = 0.25;
export const QUICK_SPEEDS = [1, 1.5, 2, 3, 4, 8, 16] as const;

export const DEFAULT_SPEED_CONFIG: SpeedConfig = {
  accelerations: {
    mediaPlayback: { enabled: false, speed: 2 },
    requestAnimationFrame: { enabled: false, speed: 2 },
    setInterval: { enabled: true, speed: 2 },
    setTimeout: { enabled: true, speed: 2 },
    webAnimations: { enabled: false, speed: 2 },
  },
  enabled: true,
  excludedHosts: [],
  mode: "automatic",
  pauseInvocations: false,
};

export const EMPTY_SPEED_STATS: SpeedStats = {
  mediaPlayback: 0,
  requestAnimationFrame: 0,
  setInterval: 0,
  setTimeout: 0,
  webAnimations: 0,
};

export function clampSpeed(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_SPEED_CONFIG.accelerations.setTimeout.speed;
  }

  const stepped = Math.round(parsed / SPEED_STEP) * SPEED_STEP;
  return Math.min(MAX_SPEED, Math.max(MIN_SPEED, stepped));
}

export function clampAccelerationSpeed(type: AccelerationType, value: unknown): number {
  return Math.min(type === "mediaPlayback" ? 16 : MAX_SPEED, clampSpeed(value));
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

export function normalizeAccelerationSettings(
  value: unknown,
  legacyEnabledFunctions?: unknown,
  legacySpeed?: unknown,
): AccelerationSettings {
  const source = isRecord(value) ? value : {};
  const legacyEnabled = isRecord(legacyEnabledFunctions) ? legacyEnabledFunctions : {};
  const migratedSpeed = clampSpeed(legacySpeed);

  return ACCELERATION_TYPES.reduce<AccelerationSettings>(
    (settings, name) => {
      const saved = isRecord(source[name]) ? source[name] : {};
      const fallback = DEFAULT_SPEED_CONFIG.accelerations[name];
      settings[name] = {
        enabled:
          typeof saved.enabled === "boolean"
            ? saved.enabled
            : typeof legacyEnabled[name] === "boolean"
              ? legacyEnabled[name]
              : fallback.enabled,
        speed:
          "speed" in saved
            ? clampAccelerationSpeed(name, saved.speed)
            : legacySpeed == null
              ? fallback.speed
              : clampAccelerationSpeed(name, migratedSpeed),
      };
      return settings;
    },
    { ...DEFAULT_SPEED_CONFIG.accelerations },
  );
}

export function normalizeSpeedConfig(value: unknown): SpeedConfig {
  const config = isRecord(value) ? value : {};
  const mode = config.mode === "manual" ? "manual" : "automatic";

  return {
    accelerations: normalizeAccelerationSettings(config.accelerations, config.enabledFunctions, config.speed),
    enabled: typeof config.enabled === "boolean" ? config.enabled : DEFAULT_SPEED_CONFIG.enabled,
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
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object";
}

export function isAccelerationType(value: string): value is AccelerationType {
  return ACCELERATION_TYPES.includes(value as AccelerationType);
}
