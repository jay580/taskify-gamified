import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../theme';

interface TaskCardProps {
  title: string;
  category: string;
  timeText: string;
  points: number;
  isExpired?: boolean;
  onPress?: () => void;
  style?: any;
}

export default function TaskCard({
  title,
  category,
  timeText,
  points,
  isExpired,
  onPress,
  style,
}: TaskCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, tension: 120, friction: 8, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }).start();
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Academic': return COLORS.link;
      case 'Domestic': return COLORS.success;
      case 'Sports': return COLORS.warning;
      case 'Special': return COLORS.secondary;
      default: return COLORS.secondary;
    }
  };

  const color = getCategoryColor(category);

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        {/* Layer 1: Base Glass Background */}
        <View style={[StyleSheet.absoluteFillObject, styles.bgGlass]} />

        {/* Layer 2: Right-side Gradient / Blur Simulation */}
        <View style={styles.rightOverlayContainer}>
          <LinearGradient
            colors={[`${color}20`, 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        {/* Layer 3: Top Lighting Reflection */}
        <LinearGradient
          colors={[COLORS.gradientCardTop, COLORS.gradientCardBottom]}
          style={styles.topLight}
        />

        {/* Content Structure */}
        <View style={styles.contentRow}>
          {/* LEFT: Details */}
          <View style={styles.leftCol}>
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            <View style={styles.tagRow}>
              <View style={[styles.categoryPill, { backgroundColor: `${color}15`, borderColor: `${color}40`, borderWidth: 1 }]}>
                <Text style={[styles.categoryText, { color: color }]}>{category}</Text>
              </View>
              {timeText ? (
                <View style={styles.timeWrapper}>
                  <MaterialCommunityIcons name={isExpired ? "alert-circle-outline" : "clock-outline"} size={14} color={isExpired ? COLORS.error : COLORS.mutedText} />
                  <Text style={[styles.timeText, isExpired && { color: COLORS.error }]}>
                    {timeText}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* RIGHT: Points & CTA */}
          <View style={styles.rightCol}>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsPlus}>+{points}</Text>
              <MaterialCommunityIcons name="star" size={14} color={COLORS.gold} style={{marginLeft: 4}} />
            </View>
            <View style={styles.ctaButton}>
              <Text style={styles.ctaText}>View</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.white} />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  bgGlass: {
    backgroundColor: COLORS.glassBackgroundLv2,
  },
  rightOverlayContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '60%',
  },
  topLight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  leftCol: {
    flex: 1,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.sm,
    letterSpacing: 0.3,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  categoryPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  categoryText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    ...TYPOGRAPHY.small,
    color: COLORS.mutedText,
    fontWeight: '500',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  pointsPlus: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.gold,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});
