import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";

import { buildSpeedInjectionScript } from "../services/speed-script.ts";

const automaticConfig = {
  accelerations: {
    setTimeout: { enabled: true, speed: 2 },
    setInterval: { enabled: true, speed: 2 },
    requestAnimationFrame: { enabled: false, speed: 1 },
    webAnimations: { enabled: false, speed: 1 },
    mediaPlayback: { enabled: false, speed: 1 },
  },
  enabled: true,
  excludedHosts: [],
  mode: "automatic",
  pauseInvocations: false,
};

function createHarness() {
  let nextNativeId = 1;
  const timers = new Map();
  const messages = [];
  const schedule =
    (kind) =>
    (callback, delay = 0) => {
      const id = nextNativeId++;
      timers.set(id, { callback, delay, kind });
      return id;
    };
  const clear = (id) => timers.delete(id);
  const window = {
    addEventListener: () => undefined,
    cancelAnimationFrame: clear,
    clearInterval: clear,
    clearTimeout: clear,
    location: { href: "https://example.com/", hostname: "example.com" },
    performance: { now: () => 0 },
    ReactNativeWebView: {
      postMessage: (message) => messages.push(JSON.parse(message)),
    },
    requestAnimationFrame: schedule("animation-frame"),
    setInterval: schedule("interval"),
    setTimeout: schedule("timeout"),
  };
  const document = {
    addEventListener: () => undefined,
    querySelectorAll: () => [],
  };
  const context = vm.createContext({
    console,
    document,
    eval,
    Map,
    Math,
    Number,
    Object,
    Set,
    String,
    WeakMap,
    WeakSet,
    window,
  });
  const runTimer = (delay, kind = "timeout") => {
    const entry = [...timers].find(([, timer]) => timer.delay === delay && timer.kind === kind);
    assert.ok(entry, `expected a ${kind} scheduled for ${delay}ms`);
    const [id, timer] = entry;
    timers.delete(id);
    timer.callback();
  };

  vm.runInContext(
    buildSpeedInjectionScript({ bridgeToken: "test-token", config: automaticConfig, disabledSourceKeys: [] }),
    context,
    { filename: "speed-browser-injection.js" },
  );

  return { context, messages, runTimer, window };
}

test("timer trigger statistics count callback invocation, not registration", () => {
  const { context, messages, runTimer } = createHarness();
  vm.runInContext("window.setTimeout(function pageTimer() {}, 100)", context, {
    filename: "https://example.com/app.js",
  });

  runTimer(50);
  runTimer(250);

  const statsMessage = messages.find((message) => message.type === "speed-browser:stats");
  assert.equal(statsMessage?.stats.setTimeout, 1);
});

test("timers retain their call-site key when automatic mode switches to manual", () => {
  const { context, messages, runTimer, window } = createHarness();
  vm.runInContext(
    "function scheduleFromPage() { return window.setTimeout(function pageTimer() {}, 100); } this.scheduleFromPage = scheduleFromPage;",
    context,
    { filename: "https://example.com/app.js" },
  );
  context.scheduleFromPage();

  window.__speedBrowser.updateConfig({ ...automaticConfig, mode: "manual" });
  runTimer(75);
  const firstCalls = messages.findLast((message) => message.type === "speed-browser:calls")?.calls;
  assert.equal(firstCalls.length, 1);
  assert.match(firstCalls[0].sourceKey, /https:\/\/example\.com\/app\.js/);

  window.__speedBrowser.command("disable-source", firstCalls[0].id, firstCalls[0].sourceKey);
  context.scheduleFromPage();
  runTimer(75);

  const finalCalls = messages.findLast((message) => message.type === "speed-browser:calls")?.calls;
  assert.deepEqual(finalCalls, []);
});
