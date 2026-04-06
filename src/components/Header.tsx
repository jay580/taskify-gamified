import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Easing, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { Avatar } from './Avatar';
import { useUser } from '../hooks/useUser';

export default function Header(props: any) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const user = useUser();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, tension: 120, friction: 8, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }).start();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.lg }]}>
      <View>
        <Text style={styles.title}>TaskQuest</Text>
        <Text style={styles.subtitle}>Shelter Don Bosco</Text>
      </View>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable 
          onPress={() => navigation.navigate('Settings')}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [
            styles.avatarContainer,
            pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }
          ]}
        >
          <Avatar user={user} size={48} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.backgroundPrimary,
    borderBottomWidth: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 12,
    zIndex: 100,
  },
  title: {
    ...TYPOGRAPHY.header,
    color: '#FFF',
    lineHeight: 32,
  },
  subtitle: {
    color: COLORS.accent,
    fontWeight: '800',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  avatarContainer: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.accent,
  }
});