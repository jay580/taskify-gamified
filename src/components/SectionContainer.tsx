import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING } from '../theme';

interface SectionContainerProps {
  title: string;
  actionText?: string;
  onActionPress?: () => void;
  horizontal?: boolean;
  children: React.ReactNode;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
  style?: any;
}

export default function SectionContainer({
  title,
  actionText,
  onActionPress,
  horizontal = false,
  children,
  icon,
  iconColor = COLORS.white,
  style,
}: SectionContainerProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          {icon && (
            <MaterialCommunityIcons name={icon} size={22} color={iconColor} style={styles.icon} />
          )}
          <Text style={styles.titleText}>{title}</Text>
        </View>
        {actionText && onActionPress && (
          <TouchableOpacity onPress={onActionPress}>
            <Text style={styles.actionText}>{actionText}</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {horizontal ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.verticalContent}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: SPACING.xs,
  },
  titleText: {
    ...TYPOGRAPHY.header,
    fontSize: 20,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  actionText: {
    ...TYPOGRAPHY.small,
    color: COLORS.link,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  verticalContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
});
