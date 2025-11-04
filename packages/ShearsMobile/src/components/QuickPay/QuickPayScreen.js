import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import useStripeTerminalPayments from './useStripeTerminal';
import { AuthContext } from '../../context/AuthContext';

export default function QuickPayScreen({ route, navigation }) {
  // Get userId and stripeAccountId from route params or your state management
const {user,token} = useContext(AuthContext)
  // Payment stat e
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null); // 'tap', 'bluetooth', 'manual'
  const [selectedBluetoothReader, setSelectedBluetoothReader] = useState(null);

  // Stripe Terminal hook
  const {
    isInitialized,
    connectedReader,
    discoveredReaders,
    isDiscovering,
    isConnecting,
    isProcessing,
    error,
    discoverLocalMobileReader,
    discoverBluetoothReaders,
    connectToLocalMobile,
    connectToBluetoothReader,
    disconnect,
    processPayment,
  } = useStripeTerminalPayments(user.userId, user.stripeAccountId);

  /* ================================================================
     CHECK DEVICE CAPABILITIES
  ================================================================ */

  const [supportsTapToPay, setSupportsTapToPay] = useState(false);

  useEffect(() => {
    // Check if device supports Tap to Pay on iPhone
    // iPhone XS or newer, iOS 15.4+
    if (Platform.OS === 'ios') {
      // You can add more sophisticated device checking here
      setSupportsTapToPay(true);
    }
  }, []);

  /* ================================================================
     READER CONNECTION HANDLERS
  ================================================================ */

  const handleConnectTapToPay = async () => {
    const reader = await connectToLocalMobile();
    if (reader) {
      setPaymentMethod('tap');
      Alert.alert('Success', 'Connected to Tap to Pay');
    }
  };

  const handleDiscoverBluetooth = async () => {
    const readers = await discoverBluetoothReaders();
    if (readers.length === 0) {
      Alert.alert('No Readers Found', 'Make sure your Bluetooth reader is powered on and nearby.');
    }
  };

  const handleConnectBluetoothReader = async (reader) => {
    const connected = await connectToBluetoothReader(reader);
    if (connected) {
      setPaymentMethod('bluetooth');
      setSelectedBluetoothReader(reader);
      Alert.alert('Success', `Connected to ${reader.label}`);
    }
  };

  const handleDisconnect = async () => {
    const success = await disconnect();
    if (success) {
      setPaymentMethod(null);
      setSelectedBluetoothReader(null);
      Alert.alert('Disconnected', 'Reader disconnected successfully');
    }
  };

  /* ================================================================
     PAYMENT PROCESSING
  ================================================================ */

  const handleProcessPayment = async () => {
    // Validate amount
    const amountInCents = Math.round(parseFloat(amount) * 100);
    
    if (isNaN(amountInCents) || amountInCents <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (!connectedReader && paymentMethod !== 'manual') {
      Alert.alert('No Reader Connected', 'Please connect a reader or use manual entry');
      return;
    }

    // Process card present payment
    if (paymentMethod === 'tap' || paymentMethod === 'bluetooth') {
      Alert.alert(
        'Ready to Accept Payment',
        `Charge $${amount}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Charge',
            onPress: async () => {
              const result = await processPayment(amountInCents, 'usd');
              
              if (result.success) {
                Alert.alert(
                  'Payment Successful! 🎉',
                  `Charged $${(result.amount / 100).toFixed(2)}`,
                  [
                    {
                      text: 'Done',
                      onPress: () => {
                        setAmount('');
                        // Navigate or perform other actions
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Payment Failed', result.error);
              }
            },
          },
        ]
      );
    }

    // Manual entry will be implemented in next phase
    if (paymentMethod === 'manual') {
      Alert.alert('Coming Soon', 'Manual entry will be available in the next update');
    }
  };

  /* ================================================================
     RENDER
  ================================================================ */

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#635BFF" />
        <Text style={styles.loadingText}>Initializing payment system...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Quick Pay</Text>
        <Text style={styles.subtitle}>Process in-person payments</Text>
      </View>

      {/* Amount Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amount</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Payment Method Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>

        {/* Connected Reader Status */}
        {connectedReader && (
          <View style={styles.connectedCard}>
            <View style={styles.connectedInfo}>
              <Text style={styles.connectedLabel}>✓ Connected</Text>
              <Text style={styles.connectedReader}>
                {connectedReader.label || 'Tap to Pay on iPhone'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
            >
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tap to Pay Option */}
        {supportsTapToPay && !connectedReader && (
          <TouchableOpacity
            style={[
              styles.methodButton,
              paymentMethod === 'tap' && styles.methodButtonActive,
            ]}
            onPress={handleConnectTapToPay}
            disabled={isConnecting}
          >
            <View style={styles.methodContent}>
              <Text style={styles.methodIcon}>📱</Text>
              <View style={styles.methodTextContainer}>
                <Text style={styles.methodTitle}>Tap to Pay on iPhone</Text>
                <Text style={styles.methodSubtitle}>Built-in reader</Text>
              </View>
            </View>
            {isConnecting && <ActivityIndicator color="#635BFF" />}
          </TouchableOpacity>
        )}

        {/* Bluetooth Reader Option */}
        {!connectedReader && (
          <View>
            <TouchableOpacity
              style={styles.methodButton}
              onPress={handleDiscoverBluetooth}
              disabled={isDiscovering}
            >
              <View style={styles.methodContent}>
                <Text style={styles.methodIcon}>🔵</Text>
                <View style={styles.methodTextContainer}>
                  <Text style={styles.methodTitle}>Bluetooth Card Reader</Text>
                  <Text style={styles.methodSubtitle}>
                    {discoveredReaders.length > 0
                      ? `${discoveredReaders.length} reader(s) found`
                      : 'Scan for readers'}
                  </Text>
                </View>
              </View>
              {isDiscovering && <ActivityIndicator color="#635BFF" />}
            </TouchableOpacity>

            {/* Show discovered readers */}
            {discoveredReaders.length > 0 && (
              <View style={styles.readersList}>
                {discoveredReaders.map((reader, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.readerItem}
                    onPress={() => handleConnectBluetoothReader(reader)}
                    disabled={isConnecting}
                  >
                    <Text style={styles.readerLabel}>{reader.label}</Text>
                    <Text style={styles.readerSerial}>{reader.serialNumber}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Manual Entry Option (Coming Soon) */}
        <TouchableOpacity
          style={[styles.methodButton, styles.methodButtonDisabled]}
          disabled
        >
          <View style={styles.methodContent}>
            <Text style={styles.methodIcon}>💳</Text>
            <View style={styles.methodTextContainer}>
              <Text style={styles.methodTitle}>Manual Card Entry</Text>
              <Text style={styles.methodSubtitle}>Coming soon</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Process Payment Button */}
      <TouchableOpacity
        style={[
          styles.processButton,
          (!amount || isProcessing || !connectedReader) && styles.processButtonDisabled,
        ]}
        onPress={handleProcessPayment}
        disabled={!amount || isProcessing || !connectedReader}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.processButtonText}>
            Process Payment {amount ? `• $${amount}` : ''}
          </Text>
        )}
      </TouchableOpacity>

      {/* Help Text */}
      <Text style={styles.helpText}>
        {!connectedReader
          ? 'Select a payment method to get started'
          : 'Enter an amount and tap Process Payment'}
      </Text>
    </ScrollView>
  );
}

/* ================================================================
   STYLES
================================================================ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  connectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  connectedInfo: {
    flex: 1,
  },
  connectedLabel: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 4,
  },
  connectedReader: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  disconnectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  disconnectButtonText: {
    color: '#D32F2F',
    fontWeight: '600',
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  methodButtonActive: {
    borderColor: '#635BFF',
    backgroundColor: '#F5F4FF',
  },
  methodButtonDisabled: {
    opacity: 0.5,
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  methodTextContainer: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  methodSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  readersList: {
    marginTop: 8,
    marginLeft: 48,
  },
  readerItem: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  readerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  readerSerial: {
    fontSize: 12,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
  },
  processButton: {
    backgroundColor: '#635BFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  processButtonDisabled: {
    backgroundColor: '#CCC',
  },
  processButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
});