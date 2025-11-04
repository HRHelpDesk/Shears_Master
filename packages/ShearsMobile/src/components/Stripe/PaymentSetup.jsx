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
import { BASE_URL } from 'shears-shared/src/config/api';

export default function PaymentSetup() {
  const { user } = useContext(AuthContext);
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeAccount, setStripeAccount] = useState(null);

  /* ------------------------------------------------------------
     1️⃣ On mount: check Stripe connection
  ------------------------------------------------------------ */
  useEffect(() => {
    if (user?.userId) {
      checkStripeStatus(user.userId);
    }
  }, [user]);

  const checkStripeStatus = async (userId) => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/v1/stripe/user/${userId}/account`);
      const data = await res.json();

      if (data.connected && data.account) {
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
     2️⃣ Handle deep link after onboarding success
  ------------------------------------------------------------ */
  useEffect(() => {
    const handleDeepLink = async (event) => {
      const url = event.url;
      if (url.includes('stripe-connected')) {
        const userId = new URL(url).searchParams.get('userId');
        await verifyStripeConnection(userId);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && initialUrl.includes('stripe-connected')) {
        const userId = new URL(initialUrl).searchParams.get('userId');
        await verifyStripeConnection(userId);
      }
    })();
    return () => subscription.remove();
  }, []);

  const verifyStripeConnection = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/v1/stripe/verify/${userId}`);
      const data = await response.json();

      if (data.connected) {
        setStripeConnected(true);
        setStripeAccount(data.account);
        Alert.alert('✅ Stripe Connected', 'Your Stripe account is now linked.');
      } else {
        Alert.alert('⚠️ Stripe Setup Incomplete', 'Please finish connecting your account.');
      }
    } catch (err) {
      Alert.alert('Error verifying Stripe connection', err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------
     3️⃣ Start Stripe onboarding
  ------------------------------------------------------------ */
  const handleConnectStripe = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/v1/stripe/connect/${user.userId}`, {
        method: 'POST',
      });
      const { url } = await response.json();
      if (!url) throw new Error('No Stripe onboarding link returned.');
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDisconnect = () => {
  Alert.alert(
    'Disconnect Stripe?',
    'This will unlink your Stripe account from your profile. You’ll need to reconnect to accept payments again.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: disconnectStripe },
    ]
  );
};

const disconnectStripe = async () => {
  try {
    setLoading(true);
    const res = await fetch(`${BASE_URL}/v1/stripe/disconnect/${user.userId}`, {
      method: 'POST',
    });
    const data = await res.json();

    if (data.success) {
      setStripeConnected(false);
      setStripeAccount(null);
      Alert.alert('✅ Disconnected', 'Your Stripe account has been unlinked.');
    } else {
      Alert.alert('Error', data.error || 'Failed to disconnect account.');
    }
  } catch (err) {
    console.error('Disconnect failed:', err);
    Alert.alert('Error', err.message);
  } finally {
    setLoading(false);
  }
};


  /* ------------------------------------------------------------
     4️⃣ UI (React Native Paper)
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
            <ActivityIndicator animating={true} size="large" style={{ marginVertical: 20 }} />
          ) : stripeConnected && stripeAccount ? (
            <>
              <Text variant="titleMedium" style={{ marginBottom: 6 }}>
                ✅ Connected to Stripe
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Account ID: <Text style={{ color: theme.colors.primary }}>{stripeAccount.id}</Text>
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Email: {stripeAccount.email || 'N/A'}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Payouts Enabled:{' '}
                {stripeAccount.payouts_enabled ? '✅ Yes' : '❌ No'}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Charges Enabled:{' '}
                {stripeAccount.charges_enabled ? '✅ Yes' : '❌ No'}
              </Text>

            <Button
                mode="outlined"
                icon="refresh"
                style={{ marginTop: 16 }}
                onPress={() => checkStripeStatus(user.userId)}
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
                onPress={() => confirmDisconnect()}
                >
                Disconnect Stripe
                </Button>

            </>
          ) : (
            <>
              <Text
                variant="bodyLarge"
                style={{ marginBottom: 20, textAlign: 'center', color: theme.colors.onSurface }}
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
