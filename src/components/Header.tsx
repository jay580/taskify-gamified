import { View, Text, TouchableOpacity } from "react-native";
import { COLORS, SPACING } from "../theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Header({
  title,
  rightAction,
  onRightPress,
}: any) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: COLORS.primary,
        padding: SPACING.md,
        paddingTop: insets.top,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text
        style={{
          color: COLORS.white,
          fontSize: 18,
          fontWeight: "700",
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>

      {rightAction && (
        <TouchableOpacity onPress={onRightPress}>
          <Text style={{ color: COLORS.white }}>{rightAction}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}