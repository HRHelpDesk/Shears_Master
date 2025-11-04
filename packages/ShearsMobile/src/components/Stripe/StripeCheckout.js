// Example usage in a screen
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import StripeTerminal from './StripeTerminal';

const CheckoutScreen = () => {
  const [amount, setAmount] = useState('');

  const handlePaymentSuccess = (paymentIntent) => {
    console.log('Payment successful!', paymentIntent);
    // Handle successful payment (update order, show receipt, etc.)
  };

  const handlePaymentCancel = () => {
    console.log('Payment canceled');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enter Amount:</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />
      
      <StripeTerminal
        amount={parseFloat(amount) || 0}
        currency="usd"
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentCancel={handlePaymentCancel}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
});

export default CheckoutScreen;