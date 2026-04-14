import React, { useRef } from "react";
import { Pressable, Text, Animated, ActivityIndicator } from "react-native";
import { COLORS, RADIUS, SPACING } from "../theme";

export default function Button({ title, onPress, variant = "primary", style, disabled, loading }: any) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const isSecondary = variant === "secondary";
  
  let bg = isPrimary ? COLORS.accent : COLORS.glassBackgroundLv2;
  if (isDanger) bg = COLORS.error;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
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
    <Animated.View style={[{ transform: [{ scale: scaleAnim }], opacity: disabled ? 0.5 : opacityAnim }, style]}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [{
          backgroundColor: bg,
          padding: SPACING.md,
          borderRadius: RADIUS.lg,
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          flexDirection: 'row',
          gap: 8,
          shadowColor: isPrimary ? COLORS.accent : (isDanger ? COLORS.error : 'transparent'),
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isPrimary ? 0.35 : (isDanger ? 0.25 : 0),
          shadowRadius: 10,
          elevation: isPrimary ? 6 : (isDanger ? 4 : 0),
          borderWidth: isSecondary ? 1 : 0,
          borderColor: COLORS.glassBorder,
        }]}
      >
        {loading && <ActivityIndicator size="small" color={isPrimary ? COLORS.black : COLORS.white} />}
        <Text style={{ 
          color: isPrimary ? COLORS.black : (isDanger ? COLORS.white : COLORS.textDark), 
          fontWeight: "800",
          letterSpacing: 0.5,
          textTransform: "uppercase",
          fontSize: 14,
        }}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}