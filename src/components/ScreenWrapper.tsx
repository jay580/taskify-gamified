import { View, StyleSheet } from "react-native";
import { COLORS, SPACING } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export default function ScreenWrapper({ children }: any) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[COLORS.gradientBgStart, COLORS.gradientBgEnd]}
      style={{
        flex: 1,
        paddingHorizontal: SPACING.md,
        paddingBottom: Math.max(insets.bottom, SPACING.md),
      }}
    >
      {children}
    </LinearGradient>
  );
}
