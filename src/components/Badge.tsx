import { View, Text } from "react-native";
import { COLORS, RADIUS, SPACING } from "../theme";

export default function Badge({ label }: any) {
  return (
    <View
      style={{
        backgroundColor: COLORS.accent,
        paddingHorizontal: SPACING.md,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: COLORS.black,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <Text style={{ fontWeight: "600", color: COLORS.black }}>{label}</Text>
    </View>
  );
}