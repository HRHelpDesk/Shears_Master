import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import {
  useStripeTerminal,
  requestNeededAndroidPermissions,
} from '@stripe/stripe-terminal-react-native';
import { AuthContext } from '../../context/AuthContext';
import { BASE_URL } from 'shears-shared/src/config/api';

const StripeTerminal = ({ amount = 100, currency = 'usd', onPaymentSuccess, onPaymentCancel }) => {
  const { user } = useContext(AuthContext);
  
const {
  initialize,
  discoverReaders,
  connectReader, // ✅ new unified method
  disconnectReader,
  collectPaymentMethod,
  confirmPaymentIntent,
  cancelCollectPaymentMethod,
  connectedReader,
  discoveredReaders,
} = useStripeTerminal({
  onUpdateDiscoveredReaders: (readers) => {setReaders(readers); console.log(readers)},
});

  const [isInitialized, setIsInitialized] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMode, setPaymentMode] = useState(null);
  const [readers, setReaders] = useState([]);
  const [tapToPaySupported, setTapToPaySupported] = useState(false);
  const [stripeAccount, setStripeAccount] = useState(null);
  const [locationId, setLocationId] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(true);

  useEffect(() => {
    loadStripeAccount();
  }, [user]);

  useEffect(() => {
    if (stripeAccount && locationId) {
      initializeTerminal();
    }
  }, [stripeAccount, locationId]);

  const loadStripeAccount = async () => {
    try {
      setLoadingAccount(true);
      
      // Get user's Stripe account
      const accountRes = await fetch(`${BASE_URL}/v1/stripe/user/${user.userId}/account`);
      const accountData = await accountRes.json();

      if (!accountData.connected || !accountData.account) {
        Alert.alert(
          'Setup Required',
          'Please connect your Stripe account in Payment Setup before using the terminal.',
          [{ text: 'OK' }]
        );
        setLoadingAccount(false);
        return;
      }
     console.log("Account", accountData.account)
      setStripeAccount(accountData.account);


      // Get or create location
      const locationRes = await fetch(`${BASE_URL}/v1/stripe/location/${user.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: `${user.username || 'User'}'s Terminal`,
        }),
      });
      
      const locationData = await locationRes.json();
      
      if (locationData.location) {
        setLocationId(locationData.location.id);
      } else {
        Alert.alert('Error', 'Failed to setup terminal location');
      }
    } catch (err) {
      console.error('Failed to load Stripe account:', err);
      Alert.alert('Error', 'Failed to load payment settings');
    } finally {
      setLoadingAccount(false);
    }
  };

  const initializeTerminal = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await requestNeededAndroidPermissions({
          accessFineLocation: {
            title: 'Location Permission',
            message: 'Stripe Terminal needs access to your location',
            buttonPositive: 'Accept',
          },
        });
        if (!granted) {
          Alert.alert('Permission Required', 'Location permission is required');
          return;
        }
      }

      const { error } = await initialize({
        fetchConnectionToken: async () => {
          try {
            const response = await fetch(`${BASE_URL}/v1/stripe/connection_token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stripeAccountId: stripeAccount.id }),
            });
            const data = await response.json();
            return data.secret;
          } catch (err) {
            console.error('Failed to fetch connection token:', err);
            throw err;
          }
        },
      });

      if (error) {
        console.error('Terminal initialization error:', error);
        Alert.alert('Initialization Error', error.message);
        return;
      }

      setIsInitialized(true);
      checkTapToPaySupport();
    } catch (err) {
      console.error('Failed to initialize terminal:', err);
      Alert.alert('Error', 'Failed to initialize payment terminal');
    }
  };

  const checkTapToPaySupport = () => {
    if (Platform.OS === 'ios') {
      setTapToPaySupported(true);
    }
  };

  const handleDiscoverReaders = async () => {
    setIsDiscovering(true);
    setReaders([]);

    try {
      const { error } = await discoverReaders({
        discoveryMethod: 'bluetoothScan',
        simulated: __DEV__,
      });

      if (error) {
        console.error('Reader discovery error:', error);
        Alert.alert('Discovery Error', error.message);
      }
    } catch (err) {
      console.error('Failed to discover readers:', err);
      Alert.alert('Error', 'Failed to discover readers');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleConnectReader = async (reader) => {
  try {
    setIsProcessing(true);

    // Use the unified API shape: (paramsObject, discoveryMethod)
    const { reader: connected, error } = await connectReader(
      {
        reader,                                  // ← full object from discovery
        locationId: locationId || reader.locationId || 'tml_simulated',
        // autoReconnectOnUnexpectedDisconnect: true, // optional
      },
      'bluetoothScan'                            // ← match your discovery method
    );
    console.log("Connected", connected)

    if (error) {
      console.error('❌ connectReader error:', error);
      Alert.alert('Connection Error', error.message);
      return;
    }

    console.log('✅ Reader connected:', connected);
    Alert.alert('✅ Connected', connected?.serialNumber || 'Simulated Reader');
    setPaymentMode('reader');
  } catch (err) {
    console.error('💥 Failed to connect reader:', err);
    Alert.alert('Error', 'Failed to connect to reader');
  } finally {
    setIsProcessing(false);
  }
};





  const handleDisconnectReader = async () => {
    try {
      await disconnectReader();
      Alert.alert('Disconnected', 'Reader has been disconnected');
      setPaymentMode(null);
    } catch (err) {
      console.error('Failed to disconnect reader:', err);
      Alert.alert('Error', 'Failed to disconnect reader');
    }
  };

  const processPayment = async (method) => {
  if (!amount || amount <= 0) {
    Alert.alert('Invalid Amount', 'Please enter a valid payment amount');
    return;
  }

  setIsProcessing(true);
  setPaymentMode(method);

  try {
    // Create Payment Intent on user's connected account
    const response = await fetch(`${BASE_URL}/v1/stripe/payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency,
        stripeAccountId: stripeAccount.id,
      }),
    });

    const data = await response.json();
    console.log('Payment Intent created:', data);

    if (data.error || !data.client_secret) {
      Alert.alert('Error', data.error || 'Failed to create payment');
      setIsProcessing(false);
      setPaymentMode(null);
      return;
    }

    // For Tap to Pay, we need to ensure a local mobile reader is connected
    if (method === 'tap' && !connectedReader) {
      try {
        // Discover local mobile readers
        const { error: discoverError } = await discoverReaders({
          discoveryMethod: 'localMobile',
          simulated: __DEV__,
        });

        if (discoverError) {
          console.error('Discovery error:', discoverError);
          Alert.alert('Tap to Pay Error', 'Could not initialize Tap to Pay. Please try again or use a physical reader.');
          setIsProcessing(false);
          setPaymentMode(null);
          return;
        }

        // Wait for discovery
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if readers were discovered
        if (!discoveredReaders || discoveredReaders.length === 0) {
          Alert.alert('Tap to Pay Not Available', 'Tap to Pay is not supported on this device.');
          setIsProcessing(false);
          setPaymentMode(null);
          return;
        }

        // Connect to the local mobile reader
        const localReader = discoveredReaders[0];
        const { error: connectError } = await connectInternetReader({
          reader: localReader,
          failIfInUse: false,
        });

        if (connectError) {
          console.error('Connection error:', connectError);
          Alert.alert('Connection Failed', connectError.message);
          setIsProcessing(false);
          setPaymentMode(null);
          return;
        }
      } catch (readerError) {
        console.error('Reader setup error:', readerError);
        Alert.alert('Setup Error', 'Failed to setup Tap to Pay reader');
        setIsProcessing(false);
        setPaymentMode(null);
        return;
      }
    }

    // Collect Payment Method
    const collectResult = await collectPaymentMethod({
      paymentIntent: data.client_secret,
      skipTipping: true,
      enableCustomerCancellation: true,
    });

    if (collectResult.error) {
      console.error('Collect payment method error:', collectResult.error);
      if (collectResult.error.code !== 'Canceled') {
        Alert.alert('Error', collectResult.error.message);
      }
      setIsProcessing(false);
      setPaymentMode(null);
      return;
    }

    // Confirm Payment Intent
    const confirmResult = await confirmPaymentIntent({
      paymentIntent: data.client_secret,
    });

    if (confirmResult.error) {
      console.error('Confirm payment error:', confirmResult.error);
      Alert.alert('Payment Failed', confirmResult.error.message);
      setIsProcessing(false);
      setPaymentMode(null);
      return;
    }

    Alert.alert('Success', 'Payment completed successfully!');
    if (onPaymentSuccess) {
      onPaymentSuccess(confirmResult.paymentIntent);
    }

    // Cleanup: disconnect local mobile reader if used
    if (method === 'tap' && connectedReader) {
      try {
        await disconnectReader();
      } catch (err) {
        console.warn('Failed to disconnect reader:', err);
      }
    }
  } catch (err) {
    console.error('Payment processing error:', err);
    Alert.alert('Error', err.message || 'An unexpected error occurred during payment');
  } finally {
    setIsProcessing(false);
    setPaymentMode(null);
  }
};

  const handleCancelPayment = async () => {
    try {
      await cancelCollectPaymentMethod();
      setIsProcessing(false);
      setPaymentMode(null);
      if (onPaymentCancel) {
        onPaymentCancel();
      }
    } catch (err) {
      console.error('Cancel payment error:', err);
    }
  };

  if (loadingAccount) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading payment settings...</Text>
      </View>
    );
  }

  if (!stripeAccount || !locationId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          ⚠️ Stripe account not connected. Please set up payments in your profile.
        </Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Initializing payment terminal...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Payment Terminal</Text>
      
      <View style={styles.accountInfo}>
        <Text style={styles.accountLabel}>Processing payments for:</Text>
        <Text style={styles.accountValue}>{stripeAccount.email}</Text>
      </View>

      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Amount to Charge:</Text>
        <Text style={styles.amountValue}>
          ${(amount || 0).toFixed(2)} {currency.toUpperCase()}
        </Text>
      </View>

      {connectedReader && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            ✓ Connected: {connectedReader.label || 'Reader'}
          </Text>
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={handleDisconnectReader}
          >
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      )}

      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#635BFF" />
          <Text style={styles.processingText}>
            {paymentMode === 'tap' 
              ? 'Present card to device...' 
              : 'Processing payment...'}
          </Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelPayment}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isProcessing && (
        <View style={styles.optionsContainer}>
          {tapToPaySupported && (
            <TouchableOpacity
              style={[styles.paymentButton, styles.tapButton]}
              onPress={() => processPayment('tap')}
              disabled={!amount}
            >
              <Text style={styles.buttonText}>📱 Tap to Pay</Text>
              <Text style={styles.buttonSubtext}>Use device NFC</Text>
            </TouchableOpacity>
          )}

          {connectedReader && (
            <TouchableOpacity
              style={[styles.paymentButton, styles.readerButton]}
              onPress={() => processPayment('reader')}
              disabled={!amount}
            >
              <Text style={styles.buttonText}>💳 Charge on Reader</Text>
              <Text style={styles.buttonSubtext}>{connectedReader.label}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {!connectedReader && !isProcessing && (
        <View style={styles.readerManagement}>
          <Text style={styles.sectionTitle}>Connect a Reader</Text>
          
          <TouchableOpacity
            style={styles.discoverButton}
            onPress={handleDiscoverReaders}
            disabled={isDiscovering}
          >
            {isDiscovering ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.discoverButtonText}>
                🔍 Discover Readers
              </Text>
            )}
          </TouchableOpacity>

          {readers.length > 0 && (
            <View style={styles.readersList}>
              <Text style={styles.readersListTitle}>Available Readers:</Text>
              {readers.map((reader, index) => (
            <TouchableOpacity
              key={reader.serialNumber || index}
              onPress={() =>{console.log('This is running'); handleConnectReader(reader)}} // ✅ full object
              style={styles.readerItem}
            >
              <Text style={styles.readerName}>
                {reader.label || `Reader ${index + 1}`}
              </Text>
              <Text style={styles.readerSerial}>{reader.serialNumber}</Text>
            </TouchableOpacity>
          ))}

            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  accountInfo: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  accountLabel: {
    fontSize: 12,
    color: '#1565C0',
    marginBottom: 4,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D47A1',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    padding: 20,
  },
  amountContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#635BFF',
  },
  statusContainer: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  disconnectButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  disconnectButtonText: {
    color: '#D32F2F',
    fontWeight: '600',
  },
  processingContainer: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  processingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 20,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#D32F2F',
    fontSize: 16,
    fontWeight: '600',
  },
  optionsContainer: {
    marginBottom: 20,
  },
  paymentButton: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tapButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  readerButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#635BFF',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#666',
  },
  readerManagement: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  discoverButton: {
    backgroundColor: '#635BFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  discoverButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  readersList: {
    marginTop: 10,
  },
  readersListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  readerItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  readerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  readerSerial: {
    fontSize: 12,
    color: '#666',
  },
});

export default StripeTerminal;