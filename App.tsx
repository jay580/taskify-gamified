import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation';
import { ToastProvider } from './src/contexts/ToastContext';
import { AuthProvider } from './src/contexts/AuthContext';
import AnimatedSplashScreen from './src/components/AnimatedSplashScreen';

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  return (
    <AuthProvider>
      <PaperProvider>
        <ToastProvider>
          <NavigationContainer>
            <RootNavigator />
            <StatusBar style="light" />
          </NavigationContainer>
          {!isAppReady && <AnimatedSplashScreen onAnimationComplete={() => setIsAppReady(true)} />}
        </ToastProvider>
      </PaperProvider>
    </AuthProvider>
  );
}
