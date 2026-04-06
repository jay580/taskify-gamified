import React, { useRef } from "react";
import { View, Animated, Easing, Pressable } from "react-native";
import { COLORS, RADIUS, SPACING } from "../theme";

interface CardProps {
  children: React.ReactNode;
  style?: any;
  variant?: 'default' | 'hero' | 'stat' | 'danger';
  onPress?: () => void;
  activeOpacity?: number;
}

export default function Card({ children, style, variant = 'default', onPress, activeOpacity = 0.9 }: CardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  // Determine base styles based on variant
  let baseStyle: any = {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  };

  if (variant === 'hero') {
    baseStyle = {
      ...baseStyle,
      padding: SPACING.xl,
      borderColor: COLORS.accent,
      shadowColor: COLORS.accent,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 8,
      overflow: 'hidden',
    };
  } else if (variant === 'stat') {
    baseStyle = {
      ...baseStyle,
      backgroundColor: COLORS.backgroundSecondary,
      paddingVertical: SPACING.md,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      marginBottom: 0,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
    };
  } else if (variant === 'danger') {
    baseStyle = {
      ...baseStyle,
      borderColor: COLORS.error,
      backgroundColor: 'rgba(229, 62, 62, 0.05)',
      shadowColor: COLORS.error,
      shadowOpacity: 0.1,
    };
  }

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          baseStyle,
          pressed && { opacity: activeOpacity }
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}