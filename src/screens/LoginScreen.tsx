import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  Keyboard,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TextInput, Button } from 'react-native-paper';
import { COLORS, SPACING, RADIUS } from '../theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const navigation = useNavigation<any>();

  const handleEmailLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    // TODO: Implement Firebase Email/Password Auth
    // Alert.alert('Sign In', `Attempting to login with email: ${email}`);
    console.log('Login with email:', email);
    navigation.navigate('StudentRoot');
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Firebase Google Auth
    Alert.alert('Google Sign-In', 'Attempting to login with Google');
    console.log('Login with Google');
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert('Forgot Password', 'Please enter your email address first to reset password.');
      return;
    }
    Alert.alert('Forgot Password', `Password reset link would be sent to: ${email}`);
  };

  const handleSignUp = () => {
    Alert.alert('Sign Up', 'This would navigate to the Sign Up Screen.');
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
            left={<TextInput.Icon icon="email-outline" />}
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
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon 
                icon={secureTextEntry ? "eye-off" : "eye"} 
                onPress={() => setSecureTextEntry(!secureTextEntry)} 
                forceTextInputFocus={false}
              />
            }
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
          >
            Sign In
          </Button>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialContainer}>
          <Button 
            mode="outlined" 
            icon="google" 
            onPress={handleGoogleLogin}
            style={styles.googleButton}
            textColor={COLORS.textSecondary}
          >
            Sign in with Google
          </Button>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.signupText}>Sign up</Text>
          </TouchableOpacity>
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.divider,
  },
  dividerText: {
    paddingHorizontal: SPACING.md,
    color: COLORS.mutedText,
    fontSize: 14,
  },
  socialContainer: {
    marginBottom: 32,
  },
  googleButton: {
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingVertical: 4,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: SPACING.lg,
  },
  footerText: {
    color: COLORS.mutedText,
    fontSize: 15,
  },
  signupText: {
    color: COLORS.link,
    fontWeight: 'bold',
    fontSize: 15,
  },
});
