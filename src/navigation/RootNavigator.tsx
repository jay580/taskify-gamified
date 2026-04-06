import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import StudentTabs from './StudentTabs';
import AdminTabs from './AdminTabs';
import { useAuth } from '@/contexts/AuthContext';

export type RootStackParamList = {
  Auth: undefined;
  StudentRoot: undefined;
  AdminRoot: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { firebaseUser, userProfile, loading } = useAuth();

  // Show spinner while resolving auth state + fetching Firestore profile
  if (loading || (firebaseUser && !userProfile)) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  const getInitialRoute = () => {
    if (!firebaseUser || !userProfile) return 'unauth';
    return userProfile.role; // 'student' | 'admin'
  };

  const role = getInitialRoute();

  return (
    <Stack.Navigator
      initialRouteName="Auth"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Auth" component={LoginScreen} />
      <Stack.Screen name="StudentRoot" component={StudentTabs} />
      <Stack.Screen name="AdminRoot" component={AdminTabs} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
});
