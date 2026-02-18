import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Card, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {
  requestPasswordReset,
  verifyResetOtp,
  resetPassword as resetPasswordApi,
} from 'shears-shared/src/Services/Authentication';

export default function ResetPasswordScreen({ appConfig, logo }) {
  const theme = useTheme();
  const navigation = useNavigation();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const gradientColors = [
    theme.colors.primary || appConfig.themeColors.primary,
    theme.colors.secondary || appConfig.themeColors.secondary,
  ];

  /* -------------------------------------------------------------------
     STEP 1: Request OTP
  ------------------------------------------------------------------- */
  const sendOtp = async () => {
    if (!email) {
      alert('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email);
      setStep(2);
    } catch (err) {
      alert(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------
     STEP 2: Verify OTP
  ------------------------------------------------------------------- */
  const verifyOtpCode = async () => {
    if (!otp) {
      alert('Please enter your reset code');
      return;
    }

    setLoading(true);
    try {
      await verifyResetOtp(email, otp);
      setStep(3);
    } catch (err) {
      alert(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------
     STEP 3: Reset Password
  ------------------------------------------------------------------- */
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert('Please enter your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordApi(email, otp, newPassword, confirmPassword);
      alert('Password reset successfully! You can now log in.');
      navigation.navigate('Login');
    } catch (err) {
      alert(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Reset Password';
      case 2: return 'Verify Code';
      case 3: return 'New Password';
      default: return 'Reset Password';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1: return 'Enter your email to receive a reset code';
      case 2: return 'We sent a 6-digit code to your email';
      case 3: return 'Create your new password';
      default: return '';
    }
  };

  return (
    <LinearGradient colors={gradientColors} style={styles.gradient}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={[styles.backButtonText, { color: '#fff' }]}>← Back</Text>
          </TouchableOpacity>

          {/* Card wrapper */}
          <View style={styles.cardWrapper}>
            <Card
              style={[
                styles.card,
                {
                  backgroundColor: theme.dark
                    ? theme.colors.elevation.level3
                    : theme.colors.surface,
                },
              ]}
              elevation={theme.dark ? 0 : 8}
            >
              <Card.Content style={styles.cardContent}>
                {/* Logo inside card */}
                <View style={styles.logoContainer}>
                  <Image source={logo} style={styles.logo} resizeMode="contain" />
                </View>

                {/* Progress indicator */}
                <View style={styles.progressContainer}>
                  {[1, 2, 3].map((num) => (
                    <View
                      key={num}
                      style={[
                        styles.progressDot,
                        step >= num && { backgroundColor: theme.colors.primary, width: 24 },
                      ]}
                    />
                  ))}
                </View>

                <Text
                  variant="headlineMedium"
                  style={[styles.title, { color: theme.colors.onSurface }]}
                >
                  {getStepTitle()}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
                >
                  {getStepSubtitle()}
                </Text>

                {/* STEP 1: Email */}
                {step === 1 && (
                  <>
                    <TextInput
                      label="Email"
                      value={email}
                      onChangeText={setEmail}
                      mode="outlined"
                      style={[styles.input, { backgroundColor: theme.colors.surface }]}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      textColor={theme.colors.onSurface}
                      outlineColor={theme.colors.outline}
                      activeOutlineColor={theme.colors.primary}
                      left={<TextInput.Icon icon="email-outline" />}
                      outlineStyle={styles.inputOutline}
                    />

                    <Button
                      mode="contained"
                      onPress={sendOtp}
                      disabled={loading}
                      style={styles.button}
                      contentStyle={styles.buttonContent}
                      labelStyle={styles.buttonLabel}
                      loading={loading}
                    >
                      {loading ? 'Sending...' : 'Send Reset Code'}
                    </Button>
                  </>
                )}

                {/* STEP 2: OTP */}
                {step === 2 && (
                  <>
                    <TextInput
                      label="Reset Code"
                      value={otp}
                      onChangeText={setOtp}
                      mode="outlined"
                      style={[styles.input, { backgroundColor: theme.colors.surface }]}
                      keyboardType="number-pad"
                      maxLength={6}
                      textColor={theme.colors.onSurface}
                      outlineColor={theme.colors.outline}
                      activeOutlineColor={theme.colors.primary}
                      left={<TextInput.Icon icon="shield-key-outline" />}
                      outlineStyle={styles.inputOutline}
                    />

                    <Button
                      mode="contained"
                      onPress={verifyOtpCode}
                      disabled={loading}
                      style={styles.button}
                      contentStyle={styles.buttonContent}
                      labelStyle={styles.buttonLabel}
                      loading={loading}
                    >
                      {loading ? 'Verifying...' : 'Verify Code'}
                    </Button>

                    <TouchableOpacity 
                      onPress={sendOtp}
                      style={styles.resendButton}
                      disabled={loading}
                    >
                      <Text style={[styles.resendText, { color: theme.colors.onSurfaceVariant }]}>
                        Resend Code
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* STEP 3: New Password */}
                {step === 3 && (
                  <>
                    <TextInput
                      label="New Password"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      mode="outlined"
                      secureTextEntry
                      style={[styles.input, { backgroundColor: theme.colors.surface }]}
                      textColor={theme.colors.onSurface}
                      outlineColor={theme.colors.outline}
                      activeOutlineColor={theme.colors.primary}
                      left={<TextInput.Icon icon="lock-outline" />}
                      outlineStyle={styles.inputOutline}
                    />

                    <TextInput
                      label="Confirm New Password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      mode="outlined"
                      secureTextEntry
                      style={[styles.input, { backgroundColor: theme.colors.surface }]}
                      textColor={theme.colors.onSurface}
                      outlineColor={theme.colors.outline}
                      activeOutlineColor={theme.colors.primary}
                      left={<TextInput.Icon icon="lock-check-outline" />}
                      outlineStyle={styles.inputOutline}
                    />

                    <Button
                      mode="contained"
                      onPress={handleResetPassword}
                      disabled={loading}
                      style={styles.button}
                      contentStyle={styles.buttonContent}
                      labelStyle={styles.buttonLabel}
                      loading={loading}
                    >
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                  </>
                )}
              </Card.Content>
            </Card>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Secure password reset • Protected by encryption
            </Text>
          </View>
        </ScrollView>
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
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
  },

  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 8,
  },

  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },

  logo: {
    width: 120,
    height: 120,
  },

  cardWrapper: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },

  card: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },

  cardContent: {
    paddingVertical: 32,
    paddingHorizontal: 24,
  },

  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },

  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },

  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '700',
  },

  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 15,
  },

  input: {
    marginBottom: 16,
  },

  inputOutline: {
    borderRadius: 12,
    borderWidth: 1.5,
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

  resendButton: {
    marginTop: 16,
    alignSelf: 'center',
  },

  resendText: {
    fontSize: 14,
    fontWeight: '600',
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