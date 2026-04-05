import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import StudentTabs from './StudentTabs';
import { useAuth } from '../contexts/AuthContext';

export type RootStackParamList = {
  Auth: undefined;
  StudentRoot: undefined;
  // AdminRoot will be added here when the admin portal is built
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {role === 'student' ? (
        // ── Student flow ──────────────────────────────────
        <Stack.Screen name="StudentRoot" component={StudentTabs} />
      ) : role === 'admin' ? (
        // ── Admin flow (placeholder — build later) ────────
        // Replace this with AdminTabs once built
        <Stack.Screen name="StudentRoot" component={StudentTabs} />
      ) : (
        // ── Not logged in ─────────────────────────────────
        <Stack.Screen name="Auth" component={LoginScreen} />
      )}
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
