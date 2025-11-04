import React, { useContext, useState } from 'react';
import { View, Button, Alert, Linking } from 'react-native';
import { AuthContext } from '../../../../shears-web/src/context/AuthContext';
import { BASE_URL } from 'shears-shared/src/config/api';

export default function StripeConnectButton({ user }) {
  const [loading, setLoading] = useState(false);
const {token, user} = useContext(AuthContext);
  const connectStripe = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/v1/stripe/connect/${user.userId}`, {
        method: 'POST',
      });
      const { url } = await response.json();

      if (url) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to get Stripe link');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Button
        title={loading ? 'Connecting...' : 'Connect My Stripe Account'}
        onPress={connectStripe}
        disabled={loading}
      />
    </View>
  );
}
