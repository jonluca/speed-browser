# Speed Browser

Speed Browser is an iOS-first React Native browser that can accelerate JavaScript timers inside the pages you visit. It is built with Expo using the architecture and tooling conventions from Palate.

## What it speeds up

- `setTimeout`
- `setInterval`
- `requestAnimationFrame` callback timestamps

The app does not speed up network requests, media playback, CSS animations, or browser-native work. At high multipliers, some pages may behave unexpectedly; acceleration can be paused globally, disabled per site, or enabled independently for each wrapped API.

Manual mode exposes active timeouts and intervals. You can pause invocations, invoke a timer immediately, disable one call, block a source location, or hide noisy sources.

## Development

Requirements: Node.js, pnpm 11.5.2, Xcode, and CocoaPods.

```sh
pnpm install
pnpm check
pnpm ios
```

Generate native projects from the Expo configuration:

```sh
pnpm mobile:prepare
```

The deterministic timer fixture used for simulator verification lives at [`fixtures/timer-test.html`](fixtures/timer-test.html). With the fixture served locally, its 4,000ms timeout completes in about 2,000ms at the default 2× speed.

## Architecture

- `app/`: Expo Router entry points and provider composition
- `components/browser/`: native-feeling browser UI and start page
- `components/settings/`: speed configuration and manual timer controls
- `services/speed-script.ts`: document-start page-world JavaScript overrides
- `store/`: persisted Zustand configuration and session state
- `types/` and `utils/`: shared domain types and pure normalization helpers

## Quality checks

```sh
pnpm typecheck
pnpm lint
pnpm format:check
```

The project uses strict TypeScript, Oxlint, Oxfmt, React Compiler, the React Native New Architecture, and a seven-day pnpm release-age policy with an explicit allowlist for the pinned Expo 56 toolchain.

## Privacy

Speed Browser does not collect browsing history, page contents, or personal information. See the full [Privacy Policy](docs/privacy.html).
