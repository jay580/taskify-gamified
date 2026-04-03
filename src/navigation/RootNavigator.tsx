import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import StudentTabs from './StudentTabs';

export type RootStackParamList = {
  Auth: undefined;
  StudentRoot: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Auth"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Auth" component={LoginScreen} />
      <Stack.Screen name="StudentRoot" component={StudentTabs} />
    </Stack.Navigator>
  );
}
