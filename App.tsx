import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation';
import { ToastProvider } from './src/contexts/ToastContext';

export default function App() {
  return (
    <PaperProvider>
      <ToastProvider>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="light" />
        </NavigationContainer>
      </ToastProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({});
