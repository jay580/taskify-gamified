import { View, Text } from "react-native";
import { COLORS, SPACING, TYPOGRAPHY } from '@/theme';

export default function Badge({ label, backgroundColor = COLORS.accent, textColor = COLORS.black }: any) {
  return (
    <View
      style={{
        backgroundColor,
        paddingHorizontal: SPACING.md,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={[TYPOGRAPHY.small, { color: textColor }]}>
        {label}
      </Text>
    </View>
  );
}