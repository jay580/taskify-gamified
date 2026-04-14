import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Animated, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import screens
import HomeScreen from '../screens/Student/Home';
import QuestsStack from './QuestsStack';
import LeaderboardScreen from '../screens/Student/Leaderboard';
import { COLORS, SPACING, RADIUS } from '../theme';
import Profile from '@/screens/Student/Profile';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused, outlineName }: { name: any, outlineName: any, focused: boolean }) => {
  const scale = useRef(new Animated.Value(focused ? 1.1 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.1 : 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={[styles.iconWrapper, focused && styles.iconWrapperFocused, { transform: [{ scale }] }]}>
      <MaterialCommunityIcons 
        name={focused ? name : outlineName} 
        color={focused ? COLORS.link : 'rgba(255,255,255,0.5)'} 
        size={22} 
      />
    </Animated.View>
  );
};

export default function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="view-grid" outlineName="view-grid-outline" />,
        }}
      />
      <Tab.Screen
        name="Quests"
        component={QuestsStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="check-circle" outlineName="check-circle-outline" />,
        }}
      />
      <Tab.Screen
        name="Rank"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="trophy" outlineName="trophy-outline" />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={Profile}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="account" outlineName="account-outline" />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.lg,
    right: SPACING.lg,
  
    backgroundColor: 'rgba(15,15,25,0.85)',
    height: 65,
    borderRadius: 20,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderTopColor: 'rgba(255,255,255,0.08)',

    justifyContent: 'space-around',
    alignItems: 'center',
    flex:1,
    paddingTop:8,
    paddingBottom:8
  },
  iconWrapper: {
    width: 40,
    height: 40,
    padding: 6,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperFocused: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 92, 255, 0.15)',
    borderRadius: 10,
    padding: 8,
    shadowColor: '#7C5CFF',
  },
});
