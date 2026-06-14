import type { ConfigContext, ExpoConfig } from "expo/config";

const VERSION = "1.0.0";

const getConfig = ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Speed Browser",
  slug: "speed-browser",
  version: VERSION,
  orientation: "portrait",
  icon: "./assets/images/icon.jpg",
  scheme: "speedbrowser",
  userInterfaceStyle: "automatic",
  ios: {
    ...config.ios,
    supportsTablet: false,
    bundleIdentifier: "com.jonluca.speedbrowser",
    buildNumber: "1",
    appleTeamId: "F35YQQ5672",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoadsInWebContent: true,
      },
    },
    privacyManifests: {
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
          NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategorySystemBootTime",
          NSPrivacyAccessedAPITypeReasons: ["35F9.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp",
          NSPrivacyAccessedAPITypeReasons: ["C617.1"],
        },
      ],
    },
  },
  android: {
    package: "com.jonluca.speedbrowser",
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    ...(config.plugins ?? []),
    [
      "expo-build-properties",
      {
        ios: {
          deploymentTarget: "16.4",
        },
      },
    ],
    "expo-router",
    "expo-sqlite",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash.png",
        imageWidth: 160,
        resizeMode: "contain",
        backgroundColor: "#F2F2F7",
        dark: {
          image: "./assets/images/splash.png",
          backgroundColor: "#000000",
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  owner: "jonluca",
});

export default getConfig;
