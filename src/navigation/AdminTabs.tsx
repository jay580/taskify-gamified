import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme';

import DashboardScreen from '../screens/Admin/Dashboard';
import ManageScreen from '../screens/Admin/Manage';
import SettingsScreen from '../screens/Admin/Settings';

const Tab = createBottomTabNavigator();

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home-outline" color={color} size={28} />
          ),
        }}
      />
      <Tab.Screen
        name="Manage"
        component={ManageScreen}
        options={{
          tabBarLabel: 'Manage',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="folder-outline" color={color} size={28} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cog-outline" color={color} size={28} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: COLORS.glassBackgroundLv1,
    height: 70,
    borderRadius: 24,
    borderTopWidth: 0,
    paddingBottom: 12,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: -4,
    letterSpacing: 0.5,
  },
});
