import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { COLORS, SPACING, RADIUS } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { sendPasswordReset } from '../services/auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    
    setLoading(true);
    try {
      await login(email, password);
      // Navigation is handled automatically by RootNavigator when auth state changes
    } catch (err: any) {
      let message = 'Login failed. Please try again.';
      if (err.code === 'auth/user-not-found') message = 'No account found with this email.';
      else if (err.code === 'auth/wrong-password') message = 'Incorrect password.';
      else if (err.code === 'auth/invalid-email') message = 'Invalid email address.';
      else if (err.code === 'auth/invalid-credential') message = 'Invalid email or password.';
      else if (err.code === 'auth/too-many-requests') message = 'Too many attempts. Try again later.';
      Alert.alert('Login Failed', message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Forgot Password', 'Please enter your email address first.');
      return;
    }
    try {
      await sendPasswordReset(email.trim());
      Alert.alert('Password Reset', `A reset link has been sent to ${email}.`);
    } catch (err: any) {
      Alert.alert('Error', 'Could not send reset email. Check the email and try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue to TASKIFY</Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              mode="outlined"
              style={styles.input}
              outlineColor={COLORS.divider}
              activeOutlineColor={COLORS.link}
              textColor={COLORS.text}
              theme={{ colors: { onSurfaceVariant: COLORS.muted } }}
              left={<TextInput.Icon icon="email-outline" color={COLORS.muted} />}
              disabled={loading}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureTextEntry}
              mode="outlined"
              style={styles.input}
              outlineColor={COLORS.divider}
              activeOutlineColor={COLORS.link}
              textColor={COLORS.text}
              theme={{ colors: { onSurfaceVariant: COLORS.muted } }}
              left={<TextInput.Icon icon="lock-outline" color={COLORS.muted} />}
              right={
                <TextInput.Icon
                  icon={secureTextEntry ? 'eye-off' : 'eye'}
                  color={COLORS.muted}
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                  forceTextInputFocus={false}
                />
              }
              disabled={loading}
            />

            <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              mode="contained"
              onPress={handleEmailLogin}
              style={styles.loginButton}
              contentStyle={styles.loginButtonContent}
              buttonColor={COLORS.link}
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 40,
    marginTop: SPACING.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textDark,




















    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.mutedText,
  },
  formContainer: {
    marginBottom: SPACING.xl,
  },
  input: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.card,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.xl,
  },
  forgotPasswordText: {
    color: COLORS.link,
    fontWeight: '600',
    fontSize: 14,
  },
  loginButton: {
    borderRadius: RADIUS.sm,
  },
  loginButtonContent: {
    paddingVertical: SPACING.xs,
  },
});
