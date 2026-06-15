# Speed Browser

Speed Browser is an iOS-first React Native browser that can accelerate timers, animations, and media inside the pages you visit. It is built with Expo using the architecture and tooling conventions from Palate.

## What it speeds up

- `setTimeout`
- `setInterval`
- `requestAnimationFrame` callback timestamps
- CSS transitions, CSS animations, and Web Animations API playback
- HTML audio and video playback

Every acceleration type has its own on/off toggle and multiplier. Timers and animations range from 1× to 100×; media ranges from 1× to 16× and may be limited further by the webpage or WebKit. Timer acceleration is enabled by default, while animation-frame, Web animation, and media acceleration are opt-in.

The app does not speed up network requests, downloads, or browser-native work. At high multipliers, some pages may behave unexpectedly; acceleration can be paused globally or disabled per site. Turning a type off immediately restores the page's authored animation or media playback rate.

Manual mode exposes active timeouts and intervals. You can pause invocations, invoke a timer immediately, disable one call, block a source location, or hide noisy sources. Animation and media acceleration continue at their configured rates while timer invocations are under manual control.

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

Production iOS builds run on EAS. EAS stores and increments the build number remotely, so it is not tracked in the app configuration:

```sh
pnpm mobile:build
```

Download the completed EAS build, then upload and submit the IPA with `asc`:

```sh
eas build:view "EAS_BUILD_ID"
curl -fL "APPLICATION_ARCHIVE_URL" -o .asc/artifacts/SpeedBrowser.ipa
IPA_PATH=.asc/artifacts/SpeedBrowser.ipa pnpm mobile:submit
```

The deterministic acceleration fixture used for simulator verification lives at [`fixtures/timer-test.html`](fixtures/timer-test.html). With the fixture served locally, its 4,000ms timeout completes in about 2,000ms at 2×. It also reports completion times for CSS and Web Animations so their independent settings can be checked.

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
