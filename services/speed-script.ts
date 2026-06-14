import type { SpeedConfig, TimerCommand } from "@/types/speed";

interface ScriptOptions {
  bridgeToken: string;
  config: SpeedConfig;
  disabledSourceKeys: string[];
}

const BRIDGE_NAMESPACE = "speed-browser";

export function buildSpeedInjectionScript({ bridgeToken, config, disabledSourceKeys }: ScriptOptions): string {
  const initialBridgeToken = JSON.stringify(bridgeToken);
  const initialConfig = JSON.stringify(config);
  const initialDisabledSources = JSON.stringify(disabledSourceKeys);

  return String.raw`
(function () {
  "use strict";

  if (window.__speedBrowser && window.__speedBrowser.installed) {
    window.__speedBrowser.updateConfig(${initialConfig});
    window.__speedBrowser.updateDisabledSources(${initialDisabledSources});
    return true;
  }

  var nativeSetTimeout = window.setTimeout.bind(window);
  var nativeClearTimeout = window.clearTimeout.bind(window);
  var nativeSetInterval = window.setInterval.bind(window);
  var nativeClearInterval = window.clearInterval.bind(window);
  var nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
  var nativeCancelAnimationFrame = window.cancelAnimationFrame.bind(window);
  var nativePerformanceNow = window.performance.now.bind(window.performance);
  var nativeFunctionToString = Function.prototype.toString;
  var nativeBridgePostMessage = window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === "function"
    ? window.ReactNativeWebView.postMessage.bind(window.ReactNativeWebView)
    : undefined;

  var config = ${initialConfig};
  var MAX_CALL_SNAPSHOTS = 200;
  var MAX_DISABLED_SOURCES = 500;
  var MAX_EXCLUDED_HOSTS = 500;
  var MAX_SOURCE_LENGTH = 512;
  var disabledSources = new Set(${initialDisabledSources}.slice(0, MAX_DISABLED_SOURCES).map(function (key) { return limitedString(key, MAX_SOURCE_LENGTH + 32); }));
  var timers = new Map();
  var callsById = new Map();
  var pendingStats = { setTimeout: 0, setInterval: 0, requestAnimationFrame: 0 };
  var nextTimerId = -1;
  var nextCallSequence = 1;
  var pageSessionId = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  var statsFlushId;
  var callsFlushId;
  var callsTickId;
  var callsWerePublished = false;
  var virtualClockBase = nativePerformanceNow();
  var realClockBase = virtualClockBase;
  var lastAnimationTimestamp = virtualClockBase;

  function post(type, payload) {
    try {
      if (nativeBridgePostMessage) {
        nativeBridgePostMessage(JSON.stringify(Object.assign({ bridgeToken: ${initialBridgeToken}, type: type }, payload || {})));
      }
    } catch (_error) {}
  }

  function normalizeSpeed(value) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed)) return 2;
    return Math.min(100, Math.max(1, Math.round(parsed * 4) / 4));
  }

  function normalizeConfig(value) {
    var source = value && typeof value === "object" ? value : {};
    var functions = source.enabledFunctions && typeof source.enabledFunctions === "object" ? source.enabledFunctions : {};
    return {
      enabled: typeof source.enabled === "boolean" ? source.enabled : true,
      enabledFunctions: {
        setTimeout: typeof functions.setTimeout === "boolean" ? functions.setTimeout : true,
        setInterval: typeof functions.setInterval === "boolean" ? functions.setInterval : true,
        requestAnimationFrame: typeof functions.requestAnimationFrame === "boolean" ? functions.requestAnimationFrame : false
      },
      excludedHosts: Array.isArray(source.excludedHosts) ? source.excludedHosts.slice(0, MAX_EXCLUDED_HOSTS).map(function (host) { return limitedString(host, 253).toLowerCase(); }) : [],
      mode: source.mode === "manual" ? "manual" : "automatic",
      pauseInvocations: source.mode === "manual" && source.pauseInvocations === true,
      speed: normalizeSpeed(source.speed)
    };
  }

  config = normalizeConfig(config);

  function hostIsExcluded() {
    return config.excludedHosts.indexOf(window.location.hostname.toLowerCase()) !== -1;
  }

  function functionIsAllowed(functionName) {
    return config.enabled && !hostIsExcluded() && config.enabledFunctions[functionName] === true;
  }

  function speedFor(functionName) {
    if (!functionIsAllowed(functionName) || config.mode !== "automatic") return 1;
    return config.speed;
  }

  function shouldManageTimer(functionName) {
    return functionIsAllowed(functionName) && (config.mode === "manual" || config.speed > 1);
  }

  function normalizedDelay(delay) {
    var parsed = Number(delay == null ? 0 : delay);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  function limitedString(value, maxLength) {
    return String(value == null ? "" : value).slice(0, maxLength);
  }

  function handlerLabel(handler) {
    if (typeof handler === "string") return limitedString(handler, 80) || "script";
    if (handler && handler.name) return limitedString(handler.name, 80);
    return "anonymous";
  }

  function fallbackSource(functionName, handler, delay) {
    var fallback = limitedString(handlerLabel(handler) + ":" + delay, MAX_SOURCE_LENGTH);
    return { key: functionName + ":" + fallback, label: fallback };
  }

  function sourceFor(functionName, handler, delay) {
    var stack = "";
    try { stack = limitedString(new Error().stack || "", 4096); } catch (_error) {}
    var lines = stack.split("\n");
    for (var index = 0; index < lines.length; index += 1) {
      var line = lines[index].trim();
      if (!line || line.indexOf("sourceFor") !== -1 || line.indexOf("managedSet") !== -1 || line.indexOf("speed-browser") !== -1) continue;
      var match = line.match(/(https?:\/\/[^\s)]+|file:\/\/[^\s)]+)/);
      if (match) {
        var location = limitedString(match[1].replace(/#.*$/, ""), MAX_SOURCE_LENGTH);
        return { key: functionName + ":" + location, label: location };
      }
    }
    return fallbackSource(functionName, handler, delay);
  }

  function logStat(functionName) {
    pendingStats[functionName] += 1;
    if (statsFlushId != null) return;
    statsFlushId = nativeSetTimeout(function () {
      statsFlushId = undefined;
      post("${BRIDGE_NAMESPACE}:stats", { stats: pendingStats });
      pendingStats = { setTimeout: 0, setInterval: 0, requestAnimationFrame: 0 };
    }, 250);
  }

  function remainingFor(record, now) {
    if (record.nativeId == null) return Math.max(0, record.remainingVirtualMs);
    var elapsed = Math.max(0, now - record.startedAt);
    return Math.max(0, record.remainingVirtualMs - elapsed * record.scheduledSpeed);
  }

  function timerSnapshot(record, now) {
    var remaining = remainingFor(record, now);
    return {
      addedAt: record.addedAt,
      delay: record.delay,
      dueAt: Date.now() + remaining / Math.max(1, record.scheduledSpeed),
      functionName: record.functionName,
      handlerLabel: record.handlerLabel,
      id: record.callId,
      publicId: record.publicId,
      remainingMs: remaining,
      sourceKey: record.sourceKey,
      sourceLabel: record.sourceLabel,
      speed: record.scheduledSpeed,
      type: record.type,
      url: limitedString(window.location.href, MAX_SOURCE_LENGTH)
    };
  }

  function stopCallsTick() {
    if (callsTickId == null) return;
    nativeClearInterval(callsTickId);
    callsTickId = undefined;
  }

  function flushCalls() {
    callsFlushId = undefined;
    if (config.mode !== "manual") {
      stopCallsTick();
      if (callsWerePublished) {
        callsWerePublished = false;
        post("${BRIDGE_NAMESPACE}:calls", { calls: [] });
      }
      return;
    }
    var now = nativePerformanceNow();
    var snapshots = [];
    var iterator = timers.values();
    var entry = iterator.next();
    while (!entry.done && snapshots.length < MAX_CALL_SNAPSHOTS) {
      snapshots.push(timerSnapshot(entry.value, now));
      entry = iterator.next();
    }
    callsWerePublished = true;
    post("${BRIDGE_NAMESPACE}:calls", { calls: snapshots });
  }

  function scheduleCallsFlush() {
    if (config.mode !== "manual") {
      stopCallsTick();
      if (!callsWerePublished) return;
    }
    if (callsFlushId == null) callsFlushId = nativeSetTimeout(flushCalls, 75);
    if (config.mode === "manual" && callsTickId == null && timers.size > 0) {
      callsTickId = nativeSetInterval(function () {
        if (timers.size === 0) {
          stopCallsTick();
          return;
        }
        flushCalls();
      }, 500);
    }
  }

  function runHandler(handler, args) {
    if (typeof handler === "function") {
      handler.apply(window, args);
    } else {
      (0, eval)(String(handler));
    }
  }

  function removeRecord(record) {
    if (record.nativeId != null) nativeClearTimeout(record.nativeId);
    record.nativeId = undefined;
    timers.delete(record.publicId);
    callsById.delete(record.callId);
    scheduleCallsFlush();
  }

  function scheduleRecord(record, absoluteDeadline) {
    if (!record.active) return;
    record.scheduledSpeed = speedFor(record.functionName);
    record.startedAt = nativePerformanceNow();
    if (config.mode === "manual" && config.pauseInvocations && functionIsAllowed(record.functionName)) {
      record.nativeId = undefined;
      scheduleCallsFlush();
      return;
    }
    var nativeDelay = record.remainingVirtualMs / Math.max(1, record.scheduledSpeed);
    if (Number.isFinite(absoluteDeadline)) {
      record.deadlineAt = Math.max(record.startedAt, absoluteDeadline);
      nativeDelay = record.deadlineAt - record.startedAt;
      record.remainingVirtualMs = nativeDelay * record.scheduledSpeed;
    } else {
      record.deadlineAt = record.startedAt + nativeDelay;
    }
    record.nativeId = nativeSetTimeout(function () {
      record.nativeId = undefined;
      if (!record.active) return;
      invokeRecord(record, true);
    }, nativeDelay);
    scheduleCallsFlush();
  }

  function scheduleNextInterval(record) {
    var now = nativePerformanceNow();
    var nextSpeed = speedFor(record.functionName);
    var period = record.delay / Math.max(1, nextSpeed);
    var previousDeadline = Number.isFinite(record.deadlineAt) ? record.deadlineAt : now;
    var nextDeadline = Math.max(now, previousDeadline + period);
    record.remainingVirtualMs = Math.max(0, nextDeadline - now) * nextSpeed;
    scheduleRecord(record, nextDeadline);
  }

  function invokeRecord(record, preserveIntervalCadence) {
    logStat(record.functionName);
    if (record.type === "timeout") {
      timers.delete(record.publicId);
      callsById.delete(record.callId);
    }
    try {
      runHandler(record.handler, record.args);
    } finally {
      try {
        if (record.type === "interval" && record.active) {
          if (preserveIntervalCadence) {
            scheduleNextInterval(record);
          } else {
            record.remainingVirtualMs = record.delay;
            scheduleRecord(record);
          }
        }
      } finally {
        scheduleCallsFlush();
      }
    }
  }

  function rescheduleAll() {
    var now = nativePerformanceNow();
    timers.forEach(function (record) {
      record.remainingVirtualMs = remainingFor(record, now);
      if (record.nativeId != null) nativeClearTimeout(record.nativeId);
      record.nativeId = undefined;
      scheduleRecord(record);
    });
  }

  function createRecord(functionName, type, handler, delay, args) {
    var source = config.mode === "manual" || disabledSources.size > 0
      ? sourceFor(functionName, handler, delay)
      : fallbackSource(functionName, handler, delay);
    var publicId = nextTimerId;
    nextTimerId -= 1;
    if (disabledSources.has(source.key)) return publicId;
    var record = {
      active: true,
      addedAt: Date.now(),
      args: args,
      callId: pageSessionId + ":" + nextCallSequence,
      deadlineAt: undefined,
      delay: delay,
      functionName: functionName,
      handler: handler,
      handlerLabel: handlerLabel(handler),
      nativeId: undefined,
      publicId: publicId,
      remainingVirtualMs: delay,
      scheduledSpeed: speedFor(functionName),
      sourceKey: source.key,
      sourceLabel: source.label,
      startedAt: nativePerformanceNow(),
      type: type
    };
    nextCallSequence += 1;
    timers.set(publicId, record);
    callsById.set(record.callId, record);
    logStat(functionName);
    scheduleRecord(record);
    return publicId;
  }

  function managedSetTimeout(handler, delay) {
    var args = Array.prototype.slice.call(arguments, 2);
    var normalized = normalizedDelay(delay);
    if (!shouldManageTimer("setTimeout")) return nativeSetTimeout.apply(window, [handler, normalized].concat(args));
    return createRecord("setTimeout", "timeout", handler, normalized, args);
  }

  function managedSetInterval(handler, delay) {
    var args = Array.prototype.slice.call(arguments, 2);
    var normalized = normalizedDelay(delay);
    if (!shouldManageTimer("setInterval")) return nativeSetInterval.apply(window, [handler, normalized].concat(args));
    return createRecord("setInterval", "interval", handler, normalized, args);
  }

  function clearManaged(id) {
    var record = timers.get(Number(id));
    if (!record) return false;
    record.active = false;
    removeRecord(record);
    return true;
  }

  function managedClearTimeout(id) {
    if (!clearManaged(id)) nativeClearTimeout(id);
  }

  function managedClearInterval(id) {
    if (!clearManaged(id)) nativeClearInterval(id);
  }

  function virtualNow(realNow) {
    return virtualClockBase + (realNow - realClockBase) * speedFor("requestAnimationFrame");
  }

  function animationTimestamp(realNow) {
    var timestamp = virtualNow(realNow);
    lastAnimationTimestamp = Math.max(lastAnimationTimestamp, timestamp);
    return lastAnimationTimestamp;
  }

  function managedRequestAnimationFrame(callback) {
    var nativeId = nativeRequestAnimationFrame(function (realTimestamp) {
      if (speedFor("requestAnimationFrame") > 1) logStat("requestAnimationFrame");
      callback(animationTimestamp(realTimestamp));
    });
    return nativeId;
  }

  function managedCancelAnimationFrame(id) {
    nativeCancelAnimationFrame(id);
  }

  function updateConfig(nextConfig) {
    var now = nativePerformanceNow();
    virtualClockBase = virtualNow(now);
    realClockBase = now;
    config = normalizeConfig(nextConfig);
    rescheduleAll();
    scheduleCallsFlush();
  }

  function updateDisabledSources(keys) {
    disabledSources = new Set(Array.isArray(keys) ? keys.slice(0, MAX_DISABLED_SOURCES).map(function (key) { return limitedString(key, MAX_SOURCE_LENGTH + 32); }) : []);
    timers.forEach(function (record) {
      if (disabledSources.has(record.sourceKey)) {
        record.active = false;
        removeRecord(record);
      }
    });
  }

  function command(action, callId, sourceKey) {
    if (config.mode !== "manual") return;
    var record = callsById.get(String(callId));
    if (action === "disable-source") {
      var key = limitedString(sourceKey || (record && record.sourceKey), MAX_SOURCE_LENGTH + 32);
      if (!key) return;
      if (!disabledSources.has(key) && disabledSources.size >= MAX_DISABLED_SOURCES) {
        disabledSources.delete(disabledSources.values().next().value);
      }
      disabledSources.add(key);
      timers.forEach(function (candidate) {
        if (candidate.sourceKey === key) {
          candidate.active = false;
          removeRecord(candidate);
        }
      });
      return;
    }
    if (!record || !record.active) return;
    if (action === "disable") {
      record.active = false;
      removeRecord(record);
      return;
    }
    if (action === "invoke") {
      if (record.nativeId != null) nativeClearTimeout(record.nativeId);
      record.nativeId = undefined;
      invokeRecord(record, false);
    }
  }

  function nativeToString(wrapper, nativeFunction) {
    try {
      Object.defineProperty(wrapper, "toString", {
        configurable: true,
        value: function () { return nativeFunctionToString.call(nativeFunction); }
      });
    } catch (_error) {}
  }

  nativeToString(managedSetTimeout, window.setTimeout);
  nativeToString(managedSetInterval, window.setInterval);
  nativeToString(managedClearTimeout, window.clearTimeout);
  nativeToString(managedClearInterval, window.clearInterval);
  nativeToString(managedRequestAnimationFrame, window.requestAnimationFrame);
  nativeToString(managedCancelAnimationFrame, window.cancelAnimationFrame);

  window.setTimeout = managedSetTimeout;
  window.setInterval = managedSetInterval;
  window.clearTimeout = managedClearTimeout;
  window.clearInterval = managedClearInterval;
  window.requestAnimationFrame = managedRequestAnimationFrame;
  window.cancelAnimationFrame = managedCancelAnimationFrame;
  window.__speedBrowser = {
    installed: true,
    command: command,
    updateConfig: updateConfig,
    updateDisabledSources: updateDisabledSources
  };

  window.addEventListener("pagehide", function () {
    if (statsFlushId != null) nativeClearTimeout(statsFlushId);
    if (callsFlushId != null) nativeClearTimeout(callsFlushId);
    if (callsTickId != null) nativeClearInterval(callsTickId);
  });

  post("${BRIDGE_NAMESPACE}:ready", { url: window.location.href });
  scheduleCallsFlush();
  return true;
})();
`;
}

export function buildConfigUpdateScript(config: SpeedConfig, disabledSourceKeys: string[]): string {
  return `window.__speedBrowser?.updateConfig(${JSON.stringify(config)}); window.__speedBrowser?.updateDisabledSources(${JSON.stringify(disabledSourceKeys)}); true;`;
}

export function buildTimerCommandScript(command: TimerCommand, callId: string, sourceKey?: string): string {
  return `window.__speedBrowser?.command(${JSON.stringify(command)}, ${JSON.stringify(callId)}, ${JSON.stringify(sourceKey)}); true;`;
}
