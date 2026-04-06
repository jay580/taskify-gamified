import React, { useRef } from "react";
import { Pressable, Text, Animated, Easing } from "react-native";
import { COLORS, RADIUS, SPACING } from "../theme";

export default function Button({ title, onPress, variant = "primary", style }: any) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const isSecondary = variant === "secondary";
  
  let bg = COLORS.primary;
  if (!isPrimary) bg = COLORS.surfaceAlt;
  if (isDanger) bg = COLORS.error;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [{
          backgroundColor: bg,
          padding: SPACING.md,
          borderRadius: RADIUS.md,
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          shadowColor: isPrimary ? COLORS.black : 'transparent',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: isPrimary ? 4 : 0,
          borderWidth: (!isPrimary && !isDanger) ? 1 : 0,
          borderColor: COLORS.border,
        }]}
      >
        <Text style={{ 
          color: isPrimary || isDanger ? COLORS.white : COLORS.textDark, 
          fontWeight: "800",
          letterSpacing: 0.5,
          textTransform: "uppercase",
          fontSize: 14
        }}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}