import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useHasHydrated } from "@/store";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hasHydrated = useHasHydrated();

  useEffect(() => {
    if (hasHydrated) {
      void SplashScreen.hideAsync();
    }
  }, [hasHydrated]);

  if (!hasHydrated) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
