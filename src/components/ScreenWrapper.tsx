import { View } from "react-native";
import { COLORS, SPACING } from "../theme";

export default function ScreenWrapper({ children }: any) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        padding: SPACING.md,
      }}
    >
      {children}
    </View>
  );
}
