import React, { useState, useContext } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Card, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { AuthContext } from '../../context/AuthContext';

export default function LoginScreen({ appConfig, logo }) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email, password, appConfig);
      navigation.replace('RootDrawer');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const gradientColors = [
    theme.colors.primary || appConfig.themeColors.primary,
    theme.colors.secondary || appConfig.themeColors.secondary,
  ];

  return (
    <LinearGradient colors={gradientColors} style={styles.gradient}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Card wrapper with max width */}
        <View style={styles.cardWrapper}>
          <Card style={styles.card} elevation={8}>
            <Card.Content style={styles.cardContent}>
              {/* Logo inside card */}
              <View style={styles.logoContainer}>
                <Image source={logo} style={styles.logo} resizeMode="contain" />
              </View>

              <Text variant="headlineMedium" style={styles.title}>
                Welcome Back
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Sign in to continue
              </Text>

              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                left={<TextInput.Icon icon="email-outline" />}
                outlineStyle={styles.inputOutline}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
                left={<TextInput.Icon icon="lock-outline" />}
                outlineStyle={styles.inputOutline}
              />

              <TouchableOpacity 
                onPress={() => navigation.navigate('ResetPassword')}
                style={styles.forgotPassword}
              >
                <Text style={styles.forgotPasswordText}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.button}
                loading={loading}
                disabled={loading}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Sign In
              </Button>
            </Card.Content>
          </Card>
        </View>

        {/* Footer text */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Secure login • Protected by encryption
          </Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { 
    flex: 1 
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },

  logo: {
    width: 300,
    height: 120,
  },

  cardWrapper: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },

  card: {
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },

  cardContent: {
    paddingVertical: 32,
    paddingHorizontal: 24,
  },

  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
    fontSize: 15,
  },

  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },

  inputOutline: {
    borderRadius: 12,
    borderWidth: 1.5,
  },

  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },

  forgotPasswordText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },

  button: {
    marginTop: 8,
    borderRadius: 12,
    elevation: 2,
  },

  buttonContent: {
    paddingVertical: 10,
  },

  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  footer: {
    marginTop: 32,
    alignItems: 'center',
  },

  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
});