import React, { useRef } from "react";
import { View, Animated, Easing, Pressable } from "react-native";
import { COLORS, RADIUS, SPACING } from "../theme";
import { LinearGradient } from "expo-linear-gradient";

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
    backgroundColor: COLORS.glassBackgroundLv2,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden', // Contain the inner lighting
  };

  if (variant === 'hero') {
    baseStyle = {
      ...baseStyle,
      backgroundColor: COLORS.glassBackgroundLv1,
      padding: SPACING.xl,
      borderColor: COLORS.accent,
      shadowColor: COLORS.accent,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 15,
      elevation: 8,
    };
  } else if (variant === 'stat') {
    baseStyle = {
      ...baseStyle,
      backgroundColor: COLORS.glassBackgroundLv3,
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
      backgroundColor: COLORS.glowError,
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
        <LinearGradient 
           colors={[COLORS.gradientCardTop, COLORS.gradientCardBottom]}
           style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%' }}
        />
        {children}
      </Pressable>
    </Animated.View>
  );
}