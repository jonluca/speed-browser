import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { Pressable, RectButton, ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import speedBrowserIcon from "@/assets/images/splash.png";
import { IconSymbol } from "@/components/icon-symbol";
import { useAppColors } from "@/theme/colors";
import { getHostname } from "@/utils/speed-config";

const FAVORITES = [
  { label: "Google", url: "https://www.google.com" },
  { label: "Wikipedia", url: "https://www.wikipedia.org" },
  { label: "GitHub", url: "https://github.com" },
  { label: "Hacker News", url: "https://news.ycombinator.com" },
] as const;

interface StartPageProps {
  onNavigate: (url: string) => void;
  onOpenAddress: () => void;
  recentUrls: string[];
}

export function StartPage({ onNavigate, onOpenAddress, recentUrls }: StartPageProps) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 150, paddingTop: insets.top + 34 }]}
      keyboardDismissMode={"interactive"}
      style={{ backgroundColor: colors.background }}
    >
      <View style={styles.hero}>
        <Image contentFit={"contain"} source={speedBrowserIcon} style={styles.logo} />
        <Text style={[styles.title, { color: colors.label }]}>Speed Browser</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>The web, with fewer artificial waits.</Text>
      </View>

      <Pressable
        accessibilityLabel={"Search or enter website name"}
        accessibilityRole={"button"}
        onPress={onOpenAddress}
        style={({ pressed }) => [
          styles.search,
          { backgroundColor: colors.card, borderColor: colors.divider },
          pressed ? styles.pressed : undefined,
        ]}
      >
        <IconSymbol color={colors.secondaryLabel} name={"magnifyingglass"} size={18} />
        <Text style={[styles.searchPlaceholder, { color: colors.secondaryLabel }]}>Search or enter website name</Text>
      </Pressable>

      <Text style={[styles.sectionTitle, { color: colors.label }]}>Favorites</Text>
      <View style={styles.favorites}>
        {FAVORITES.map((favorite) => (
          <Pressable
            accessibilityLabel={`Open ${favorite.label}`}
            accessibilityRole={"button"}
            key={favorite.url}
            onPress={() => onNavigate(favorite.url)}
            style={({ pressed }) => [styles.favorite, pressed ? styles.pressed : undefined]}
          >
            <View style={[styles.favoriteIcon, { backgroundColor: colors.card, borderColor: colors.divider }]}>
              <IconSymbol color={colors.accent} name={"globe.americas.fill"} size={28} />
            </View>
            <Text numberOfLines={1} style={[styles.favoriteLabel, { color: colors.label }]}>
              {favorite.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {recentUrls.length > 0 ? (
        <View style={styles.recentSection}>
          <Text style={[styles.sectionTitle, { color: colors.label }]}>Recently Visited</Text>
          <View style={[styles.recentCard, { backgroundColor: colors.card }]}>
            {recentUrls.slice(0, 5).map((url, index) => (
              <RectButton key={url} onPress={() => onNavigate(url)} style={styles.recentButton}>
                <View
                  accessibilityLabel={`Open ${getHostname(url) ?? url}`}
                  accessibilityRole={"button"}
                  style={[
                    styles.recentRow,
                    index > 0 ? { borderColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth } : undefined,
                  ]}
                >
                  <IconSymbol color={colors.accent} name={"link"} size={17} />
                  <View style={styles.recentText}>
                    <Text numberOfLines={1} style={[styles.recentHost, { color: colors.label }]}>
                      {getHostname(url) ?? url}
                    </Text>
                    <Text numberOfLines={1} style={[styles.recentUrl, { color: colors.secondaryLabel }]}>
                      {url}
                    </Text>
                  </View>
                </View>
              </RectButton>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 22,
  },
  favorite: {
    alignItems: "center",
    gap: 7,
    width: "22%",
  },
  favoriteIcon: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    height: 62,
    justifyContent: "center",
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
    width: 62,
  },
  favoriteLabel: {
    fontSize: 12,
    maxWidth: 80,
  },
  favorites: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 34,
  },
  hero: {
    alignItems: "center",
    marginBottom: 26,
  },
  logo: {
    borderRadius: 22,
    height: 84,
    marginBottom: 14,
    width: 84,
  },
  pressed: {
    opacity: 0.58,
    transform: [{ scale: 0.98 }],
  },
  recentButton: {
    backgroundColor: "transparent",
  },
  recentCard: {
    borderRadius: 14,
    overflow: "hidden",
  },
  recentHost: {
    fontSize: 15,
    fontWeight: "600",
  },
  recentRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginLeft: 15,
    minHeight: 58,
    paddingRight: 14,
  },
  recentSection: {
    marginTop: 4,
  },
  recentText: {
    flex: 1,
  },
  recentUrl: {
    fontSize: 12,
    marginTop: 2,
  },
  search: {
    alignItems: "center",
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 8,
    height: 48,
    marginBottom: 28,
    paddingHorizontal: 14,
  },
  searchPlaceholder: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 13,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
});
