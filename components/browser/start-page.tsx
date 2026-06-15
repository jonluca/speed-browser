import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { Pressable, RectButton, ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import speedBrowserIcon from "@/assets/images/splash.png";
import { IconSymbol, type IconSymbolName } from "@/components/icon-symbol";
import { GlassSurface } from "@/components/ui/glass-surface";
import { useAppColors } from "@/theme/colors";
import { getHostname } from "@/utils/speed-config";

const FAVORITES: ReadonlyArray<{
  color?: string;
  icon: IconSymbolName;
  label: string;
  url: string;
}> = [
  { color: "#4285F4", icon: "magnifyingglass", label: "Google", url: "https://www.google.com" },
  { icon: "book.closed.fill", label: "Wikipedia", url: "https://www.wikipedia.org" },
  {
    icon: "chevron.left.forwardslash.chevron.right",
    label: "GitHub",
    url: "https://github.com",
  },
  { color: "#F47B20", icon: "newspaper.fill", label: "Hacker News", url: "https://news.ycombinator.com" },
];

interface StartPageProps {
  onNavigate: (url: string) => void;
  recentUrls: string[];
}

export function StartPage({ onNavigate, recentUrls }: StartPageProps) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 154 }]}
      keyboardDismissMode={"interactive"}
      style={{ backgroundColor: colors.background }}
    >
      <View style={styles.header}>
        <Image contentFit={"contain"} source={speedBrowserIcon} style={styles.logo} />
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.label }]}>Speed Browser</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>The web, without the waiting.</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.label }]}>Favorites</Text>
        <Text style={[styles.sectionHint, { color: colors.secondaryLabel }]}>Tap the address bar to search</Text>
      </View>
      <View style={styles.favorites}>
        {FAVORITES.map((favorite) => (
          <Pressable
            accessibilityLabel={`Open ${favorite.label}`}
            accessibilityRole={"button"}
            key={favorite.url}
            onPress={() => onNavigate(favorite.url)}
            style={({ pressed }) => [styles.favorite, pressed ? styles.pressed : undefined]}
          >
            <GlassSurface
              fallbackColor={colors.card}
              interactive={true}
              style={[styles.favoriteIcon, { borderColor: colors.glassStroke }]}
            >
              <IconSymbol color={favorite.color ?? colors.label} name={favorite.icon} size={24} weight={"semibold"} />
            </GlassSurface>
            <Text numberOfLines={1} style={[styles.favoriteLabel, { color: colors.label }]}>
              {favorite.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionTitle, styles.recentTitle, { color: colors.label }]}>Recently Visited</Text>
      <GlassSurface fallbackColor={colors.card} style={[styles.recentSurface, { borderColor: colors.glassStroke }]}>
        {recentUrls.length > 0 ? (
          recentUrls.slice(0, 6).map((url, index) => (
            <RectButton key={url} onPress={() => onNavigate(url)} style={styles.recentButton}>
              <View
                accessibilityLabel={`Open ${getHostname(url) ?? url}`}
                accessibilityRole={"button"}
                style={[
                  styles.recentRow,
                  index > 0 ? { borderColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth } : undefined,
                ]}
              >
                <View style={[styles.recentIcon, { backgroundColor: colors.accentMuted }]}>
                  <IconSymbol color={colors.accent} name={"globe"} size={16} weight={"semibold"} />
                </View>
                <View style={styles.recentText}>
                  <Text numberOfLines={1} style={[styles.recentHost, { color: colors.label }]}>
                    {getHostname(url) ?? url}
                  </Text>
                  <Text numberOfLines={1} style={[styles.recentUrl, { color: colors.secondaryLabel }]}>
                    {url}
                  </Text>
                </View>
                <IconSymbol color={colors.tertiaryLabel} name={"chevron.forward"} size={12} weight={"semibold"} />
              </View>
            </RectButton>
          ))
        ) : (
          <View style={styles.emptyRecent}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accentMuted }]}>
              <IconSymbol color={colors.accent} name={"hand.raised.fill"} size={20} />
            </View>
            <View style={styles.emptyCopy}>
              <Text style={[styles.emptyTitle, { color: colors.label }]}>Ready when you are</Text>
              <Text style={[styles.emptyBody, { color: colors.secondaryLabel }]}>
                Pages you visit will appear here. Browsing stays on this device.
              </Text>
            </View>
          </View>
        )}
      </GlassSurface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  emptyCopy: {
    flex: 1,
  },
  emptyIcon: {
    alignItems: "center",
    borderRadius: 19,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  emptyRecent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 88,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  favorite: {
    alignItems: "center",
    gap: 8,
    width: "23%",
  },
  favoriteIcon: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    height: 64,
    justifyContent: "center",
    overflow: "hidden",
    width: 64,
  },
  favoriteLabel: {
    fontSize: 12,
    letterSpacing: -0.1,
    maxWidth: 82,
  },
  favorites: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 36,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 38,
    paddingHorizontal: 4,
  },
  headerCopy: {
    flex: 1,
  },
  logo: {
    borderRadius: 13,
    height: 52,
    marginRight: 13,
    width: 52,
  },
  pressed: {
    opacity: 0.6,
    transform: [{ scale: 0.96 }],
  },
  recentButton: {
    backgroundColor: "transparent",
  },
  recentHost: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.15,
  },
  recentIcon: {
    alignItems: "center",
    borderRadius: 17,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  recentRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 11,
    marginLeft: 14,
    minHeight: 61,
    paddingRight: 15,
  },
  recentSurface: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  recentText: {
    flex: 1,
  },
  recentTitle: {
    marginBottom: 12,
  },
  recentUrl: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeader: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionHint: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.35,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 3,
  },
  title: {
    fontSize: 27,
    fontWeight: "700",
    letterSpacing: -0.7,
  },
});
