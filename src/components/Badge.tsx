import { View, Text } from "react-native";
import { COLORS, SPACING, TYPOGRAPHY } from '@/theme';

export default function Badge({ label, backgroundColor = COLORS.accent, textColor = COLORS.black }: any) {
  return (
    <View
      style={{
        backgroundColor,
        paddingHorizontal: SPACING.md,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: COLORS.black,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <Text style={[TYPOGRAPHY.small, { color: textColor }]}>
        {label}
      </Text>
    </View>
  );
}