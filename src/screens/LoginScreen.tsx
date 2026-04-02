import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const handleEmailLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    // TODO: Implement Firebase Email/Password Auth
    Alert.alert('Sign In', `Attempting to login with email: ${email}`);
    console.log('Login with email:', email);
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            outlineColor="#E0E0E0"
            activeOutlineColor="#6200EE"
            left={<TextInput.Icon icon="email-outline" />}
          />
          
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            mode="outlined"
            style={styles.input}
            outlineColor="#E0E0E0"
            activeOutlineColor="#6200EE"
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
            buttonColor="#6200EE"
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
            textColor="#333333"
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#6200EE',
    fontWeight: '600',
    fontSize: 14,
  },
  loginButton: {
    borderRadius: 8,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#666666',
    fontSize: 14,
  },
  socialContainer: {
    marginBottom: 32,
  },
  googleButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 4,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    color: '#666666',
    fontSize: 15,
  },
  signupText: {
    color: '#6200EE',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
