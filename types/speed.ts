export const SPEED_FUNCTIONS = ["setTimeout", "setInterval", "requestAnimationFrame"] as const;
export const SPEED_MODES = ["automatic", "manual"] as const;

export type SpeedFunctionName = (typeof SPEED_FUNCTIONS)[number];
export type SpeedMode = (typeof SPEED_MODES)[number];
export type SpeedFunctionSettings = Record<SpeedFunctionName, boolean>;

export interface SpeedConfig {
  enabled: boolean;
  enabledFunctions: SpeedFunctionSettings;
  excludedHosts: string[];
  mode: SpeedMode;
  pauseInvocations: boolean;
  speed: number;
}

export interface SpeedStats {
  requestAnimationFrame: number;
  setInterval: number;
  setTimeout: number;
}

export interface TimerCall {
  addedAt: number;
  delay: number;
  dueAt: number;
  functionName: "setInterval" | "setTimeout";
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
