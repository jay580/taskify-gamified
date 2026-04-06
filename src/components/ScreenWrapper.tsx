import { View, StyleSheet } from "react-native";
import { COLORS, SPACING } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ScreenWrapper({ children }: any) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.backgroundPrimary,
        paddingHorizontal: SPACING.md,
        paddingBottom: Math.max(insets.bottom, SPACING.md),
      }}
    >
      {children}
    </View>
  );
}
