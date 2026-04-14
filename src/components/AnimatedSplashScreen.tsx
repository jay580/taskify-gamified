import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS } from '../theme';
import Logo from './Logo';

export default function AnimatedSplashScreen({ onAnimationComplete }: { onAnimationComplete: () => void }) {
  const scaleValue = useRef(new Animated.Value(0.5)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Sequence: Pop in (scale & opacity), wait, fade out (opacity)
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1200), // Hold the splash screen
      Animated.timing(contentOpacity, {
         toValue: 0,
         duration: 400,
         useNativeDriver: true,
      })
    ]).start(() => {
      onAnimationComplete();
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
        <Animated.View style={{ transform: [{ scale: scaleValue }], opacity: opacityValue, alignItems: 'center' }}>
          <Logo size={80} />
          <Text style={styles.title}>TASKIFY</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.backgroundPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, // Ensure it covers everything
    elevation: 9999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
    marginTop: 20,
    letterSpacing: 4,
  }
});
