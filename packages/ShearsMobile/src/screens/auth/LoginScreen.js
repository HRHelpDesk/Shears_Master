import React, { useState, useContext } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
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
      await login(email, password);
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
        <View style={styles.logoContainer}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
        </View>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={6}>
          <Card.Content style={styles.cardContent}>
            <Text
              variant="headlineSmall"
              style={[styles.title, { color: theme.colors.onSurface }]}
            >
              Sign in
            </Text>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={[styles.input, { backgroundColor: theme.colors.background }]}
              keyboardType="email-address"
              autoCapitalize="none"
              theme={{ colors: { primary: theme.colors.primary, text: theme.colors.text } }}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={[styles.input, { backgroundColor: theme.colors.background }]}
              theme={{ colors: { primary: theme.colors.primary, text: theme.colors.text } }}
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              style={styles.button}
              loading={loading}
              disabled={loading}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              contentStyle={{ paddingVertical: 8 }}
            >
              Login
            </Button>
          </Card.Content>
        </Card>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logo: { width: 180, height: 180 },
  card: { borderRadius: 16, paddingVertical: 20, paddingHorizontal: 15 },
  cardContent: { width: '100%' },
  title: { textAlign: 'center', marginBottom: 16, fontWeight: 'bold' },
  input: { marginBottom: 15 },
  button: { marginTop: 10, borderRadius: 8 },
});
