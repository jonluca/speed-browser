export const ACCELERATION_TYPES = [
  "setTimeout",
  "setInterval",
  "requestAnimationFrame",
  "webAnimations",
  "mediaPlayback",
] as const;
export const TIMER_FUNCTIONS = ["setTimeout", "setInterval"] as const;
export const SPEED_MODES = ["automatic", "manual"] as const;

export type AccelerationType = (typeof ACCELERATION_TYPES)[number];
export type TimerFunctionName = (typeof TIMER_FUNCTIONS)[number];
export type SpeedMode = (typeof SPEED_MODES)[number];

export interface AccelerationConfig {
  enabled: boolean;
  speed: number;
}

export type AccelerationSettings = Record<AccelerationType, AccelerationConfig>;

export interface SpeedConfig {
  accelerations: AccelerationSettings;
  enabled: boolean;
  excludedHosts: string[];
  mode: SpeedMode;
  pauseInvocations: boolean;
}

export type SpeedStats = Record<AccelerationType, number>;

export interface TimerCall {
  addedAt: number;
  delay: number;
  dueAt: number;
  functionName: TimerFunctionName;
  handlerLabel: string;
  id: string;
  publicId: number;
  remainingMs: number;
  sourceKey: string;
  sourceLabel: string;
  speed: number;
  type: "interval" | "timeout";
  url: string;
}

export type TimerCommand = "disable" | "disable-source" | "invoke";

export type WebViewBridgeMessage =
  | { type: "speed-browser:calls"; calls: TimerCall[] }
  | { type: "speed-browser:ready"; url: string }
  | { type: "speed-browser:stats"; stats: Partial<SpeedStats> };
