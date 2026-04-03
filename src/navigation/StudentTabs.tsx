import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import screens
import HomeScreen from '../screens/Student/Home';
import TasksScreen from '../screens/Student/Tasks';
import LeaderboardScreen from '../screens/Student/Leaderboard';
import ProfileScreen from '../screens/Student/Profile';

const Tab = createBottomTabNavigator();

const CustomTabBarButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={styles.customButtonContainer}
    onPress={() => Alert.alert('Add Action', 'This will probably open a modal to add a quick task or an action menu.')}
  >
    <View style={styles.customButton}>
      {children}
    </View>
  </TouchableOpacity>
);

export default function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#6200EE',
        tabBarInactiveTintColor: '#A0A0A0',
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-grid-outline" color={color} size={28} />
          ),
        }}
      />
      <Tab.Screen
        name="Quests"
        component={TasksScreen}
        options={{
          tabBarLabel: 'Quests',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="check-circle-outline" color={color} size={28} />
          ),
        }}
      />

      {/* Spacer/Action Tab */}
      <Tab.Screen
        name="AddAction"
        component={View} // Dummy component since button is handled custom
        options={{
          tabBarLabel: '',
          // Use a custom button component for the center '+' action
          tabBarButton: (props) => (
            <CustomTabBarButton {...props}>
              <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
            </CustomTabBarButton>
          ),
        }}
        listeners={{
          tabPress: e => {
            // Prevent default navigation
            e.preventDefault();
          },
        }}
      />

      <Tab.Screen
        name="Rank"
        component={LeaderboardScreen}
        options={{
          tabBarLabel: 'Rank',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="trophy-outline" color={color} size={28} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-outline" color={color} size={28} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    elevation: 0,
    backgroundColor: '#ffffff',
    height: 70,
    borderTopWidth: 1,
    borderTopColor: '#f2f2f2',
    paddingBottom: 10,
    paddingTop: 10,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: -5,
  },
  customButtonContainer: {
    top: -25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6200EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  customButton: {
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: '#6200EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
