import React, { useContext, useEffect, useState } from 'react';
import { View, Linking, Alert } from 'react-native';
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  useTheme,
  Divider,
  IconButton,
} from 'react-native-paper';
import { AuthContext } from '../../context/AuthContext';
import { connectStripeAccount, disconnectStripeAccount, verifyStripeAccount } from 'shears-shared/src/Services/Authentication';


export default function PaymentSetup() {
  const { user, token } = useContext(AuthContext);
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeAccount, setStripeAccount] = useState(null);

  /* ------------------------------------------------------------
     1️⃣ Check Stripe status on mount
  ------------------------------------------------------------ */
  useEffect(() => {
    if (user?.userId && token) {
      loadStripeStatus();
    }
  }, [user, token]);

  const loadStripeStatus = async () => {
    try {
      setLoading(true);
      const data = await verifyStripeAccount(user.userId, token);

      if (data.connected) {
        setStripeConnected(true);
        setStripeAccount(data.account);
      } else {
        setStripeConnected(false);
      }
    } catch (err) {
      console.error('Stripe status check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------
     2️⃣ Deep link handler for Stripe return_url
  ------------------------------------------------------------ */
  useEffect(() => {
    const handler = async (event) => {
      const url = event?.url;
      if (!url) return;

      if (url.includes('stripe-connected')) {
        await loadStripeStatus();
        Alert.alert('✅ Stripe Connected', 'Your Stripe account is now linked.');
      }
    };

    const subscription = Linking.addEventListener('url', handler);

    (async () => {
      const initial = await Linking.getInitialURL();
      if (initial && initial.includes('stripe-connected')) {
        await loadStripeStatus();
      }
    })();

    return () => subscription.remove();
  }, []);

  /* ------------------------------------------------------------
     3️⃣ Connect Stripe (Shared API now)
  ------------------------------------------------------------ */
  const handleConnectStripe = async () => {
    try {
      setLoading(true);

      const url = await connectStripeAccount(user.userId, token);
      if (!url) throw new Error('Stripe did not return an onboarding URL');

      await Linking.openURL(url);
    } catch (err) {
      console.error('Stripe connect error:', err);
      Alert.alert('Stripe Error', err.message || 'Unable to start Stripe onboarding.');
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------
     4️⃣ Disconnect Stripe
  ------------------------------------------------------------ */
  const confirmDisconnect = () => {
    Alert.alert(
      'Disconnect Stripe?',
      'This will unlink your Stripe account. You’ll need to reconnect to accept payments again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: disconnectNow },
      ]
    );
  };

  const disconnectNow = async () => {
    try {
      setLoading(true);
      const data = await disconnectStripeAccount(user.userId, token);

      if (data?.success) {
        setStripeConnected(false);
        setStripeAccount(null);
        Alert.alert('Disconnected', 'Your Stripe account has been unlinked.');
      } else {
        Alert.alert('Error', data?.error || 'Failed to disconnect Stripe.');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------
     5️⃣ UI (React Native Paper)
  ------------------------------------------------------------ */
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 16,
        justifyContent: 'center',
      }}
    >
      <Card style={{ elevation: 3, borderRadius: 12 }}>
        <Card.Title
          title="Payment Setup"
          subtitle="Manage your Stripe connection"
          left={(props) => (
            <IconButton
              {...props}
              icon={stripeConnected ? 'check-circle-outline' : 'credit-card-outline'}
              color={stripeConnected ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
          )}
        />

        <Divider />

        <Card.Content style={{ paddingVertical: 16 }}>
          {loading ? (
            <ActivityIndicator animating size="large" style={{ marginVertical: 20 }} />
          ) : stripeConnected && stripeAccount ? (
            <>
              <Text variant="titleMedium" style={{ marginBottom: 6 }}>
                ✅ Connected to Stripe
              </Text>

              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Account ID:{' '}
                <Text style={{ color: theme.colors.primary }}>{stripeAccount.id}</Text>
              </Text>

              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Email: {stripeAccount.email || 'N/A'}
              </Text>

              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Charges Enabled: {stripeAccount.charges_enabled ? '✅ Yes' : '❌ No'}
              </Text>

              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Payouts Enabled: {stripeAccount.payouts_enabled ? '✅ Yes' : '❌ No'}
              </Text>

              <Button
                mode="outlined"
                icon="refresh"
                style={{ marginTop: 16 }}
                onPress={loadStripeStatus}
              >
                Refresh Account
              </Button>

              <Button
                mode="contained-tonal"
                icon="link-off"
                textColor="red"
                style={{
                  marginTop: 12,
                  borderRadius: 8,
                  backgroundColor: theme.colors.surfaceVariant,
                }}
                onPress={confirmDisconnect}
              >
                Disconnect Stripe
              </Button>
            </>
          ) : (
            <>
              <Text
                variant="bodyLarge"
                style={{
                  marginBottom: 20,
                  textAlign: 'center',
                  color: theme.colors.onSurface,
                }}
              >
                Connect your Stripe account to accept payments directly through your profile.
              </Text>

              <Button
                mode="contained"
                icon="credit-card-plus-outline"
                onPress={handleConnectStripe}
                loading={loading}
                disabled={loading}
                style={{
                  borderRadius: 8,
                  marginHorizontal: 20,
                  backgroundColor: theme.colors.primary,
                }}
              >
                Connect Stripe
              </Button>
            </>
          )}
        </Card.Content>
      </Card>
    </View>
  );
}
