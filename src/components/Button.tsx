import { TouchableOpacity, Text } from "react-native";
import { COLORS, RADIUS, SPACING } from "../theme";

export default function Button({ title, onPress, variant = "primary" }: any) {
  const bg =
    variant === "primary" ? COLORS.primary : COLORS.secondary;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: bg,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        alignItems: "center",
        width: "100%",
      }}
    >
      <Text style={{ color: COLORS.white, fontWeight: "600" }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}