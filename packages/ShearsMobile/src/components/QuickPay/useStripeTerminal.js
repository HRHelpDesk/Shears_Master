import { useEffect, useState, useCallback } from 'react';
import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';
import { BASE_URL } from 'shears-shared/src/config/api';

export default function useStripeTerminalPayments(userId, stripeAccountId) {
  const {
    initialize,
    discoverReaders,
    connectLocalMobileReader,
    connectBluetoothReader,
    disconnectReader,
    collectPaymentMethod,
    confirmPaymentIntent,
  } = useStripeTerminal();

  // ───────────────────────────────
  // STATE
  // ───────────────────────────────
  const [isInitialized, setIsInitialized] = useState(false);
  const [discoveredReaders, setDiscoveredReaders] = useState([]);
  const [connectedReader, setConnectedReader] = useState(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [locationId, setLocationId] = useState(null);

  // ───────────────────────────────
  // 1️⃣ INITIALIZATION
  // ───────────────────────────────
  const initializeTerminal = useCallback(async () => {
    try {
      setError(null);

      const { error: initError } = await initialize({
        fetchConnectionToken: async () => {
          const response = await fetch(`${BASE_URL}/v1/stripe/connection_token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stripeAccountId }),
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Failed to fetch connection token');
          return data.secret;
        },
      });

      if (initError) {
        console.error('Terminal initialization failed:', initError);
        setError(initError.message);
        return false;
      }

      setIsInitialized(true);
      console.log('✅ Stripe Terminal initialized');
      return true;
    } catch (err) {
      console.error('Terminal initialization error:', err);
      setError(err.message);
      return false;
    }
  }, [initialize, stripeAccountId]);

  // ───────────────────────────────
  // 2️⃣ LOCATION MANAGEMENT
  // ───────────────────────────────
  const ensureLocation = useCallback(async () => {
    if (!userId || !stripeAccountId) return null;
    try {
      const res = await fetch(`${BASE_URL}/v1/stripe/location/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Main Location',
          address: {
            line1: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            country: 'US',
            postal_code: '94111',
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get/create location');
      const id = data.location?.id;
      setLocationId(id);
      console.log('✅ Using location:', id);
      return id;
    } catch (err) {
      console.error('Location creation error:', err);
      setError(err.message);
      return null;
    }
  }, [userId, stripeAccountId]);

  // ───────────────────────────────
  // 3️⃣ READER DISCOVERY
  // ───────────────────────────────
  const discoverLocalMobileReader = useCallback(async () => {
    try {
      setIsDiscovering(true);
      setError(null);

      const { error: discoverError } = await discoverReaders({
        discoveryMethod: 'localMobile',
        simulated: __DEV__,
      });

      if (discoverError) {
        console.error('Local mobile discovery error:', discoverError);
        setError(discoverError.message);
        return false;
      }

      console.log('✅ Local mobile reader discovered');
      return true;
    } catch (err) {
      console.error('Discovery error:', err);
      setError(err.message);
      return false;
    } finally {
      setIsDiscovering(false);
    }
  }, [discoverReaders]);

  const discoverBluetoothReaders = useCallback(async () => {
    try {
      setIsDiscovering(true);
      setError(null);
      setDiscoveredReaders([]);

      const { error: discoverError, readers } = await discoverReaders({
        discoveryMethod: 'bluetoothScan',
        simulated: __DEV__,
      });

      if (discoverError) {
        console.error('Bluetooth discovery error:', discoverError);
        setError(discoverError.message);
        return [];
      }

      console.log(`✅ Found ${readers?.length || 0} Bluetooth readers`);
      setDiscoveredReaders(readers || []);
      return readers || [];
    } catch (err) {
      console.error('Bluetooth discovery error:', err);
      setError(err.message);
      return [];
    } finally {
      setIsDiscovering(false);
    }
  }, [discoverReaders]);

  // ───────────────────────────────
  // 4️⃣ CONNECT / DISCONNECT
  // ───────────────────────────────
  const connectToLocalMobile = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const locId = locationId || (await ensureLocation());
      if (!locId) throw new Error('No valid location available');

      await discoverLocalMobileReader();

      const { reader, error: connectError } = await connectLocalMobileReader({
        locationId: locId,
      });

      if (connectError) {
        console.error('Connection error:', connectError);
        setError(connectError.message);
        return null;
      }

      console.log('✅ Connected to Tap to Pay reader');
      setConnectedReader(reader);
      return reader;
    } catch (err) {
      console.error('Local mobile connection error:', err);
      setError(err.message);
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [connectLocalMobileReader, discoverLocalMobileReader, ensureLocation, locationId]);

  const connectToBluetoothReader = useCallback(
    async (reader) => {
      try {
        setIsConnecting(true);
        setError(null);

        const locId = locationId || (await ensureLocation());
        if (!locId) throw new Error('No valid location available');

        const { reader: connectedReader, error: connectError } = await connectBluetoothReader({
          reader,
          locationId: locId,
        });

        if (connectError) {
          console.error('Bluetooth connection error:', connectError);
          setError(connectError.message);
          return null;
        }

        console.log('✅ Connected to Bluetooth reader:', connectedReader.label);
        setConnectedReader(connectedReader);
        return connectedReader;
      } catch (err) {
        console.error('Bluetooth connection error:', err);
        setError(err.message);
        return null;
      } finally {
        setIsConnecting(false);
      }
    },
    [connectBluetoothReader, ensureLocation, locationId]
  );

  const disconnect = useCallback(async () => {
    try {
      const { error: disconnectError } = await disconnectReader();

      if (disconnectError) {
        console.error('Disconnect error:', disconnectError);
        return false;
      }

      setConnectedReader(null);
      console.log('✅ Disconnected from reader');
      return true;
    } catch (err) {
      console.error('Disconnect error:', err);
      return false;
    }
  }, [disconnectReader]);

  // ───────────────────────────────
  // 5️⃣ PAYMENT PROCESSING
  // ───────────────────────────────
  const processPayment = useCallback(
    async (amount, currency = 'usd') => {
      try {
        setIsProcessing(true);
        setError(null);

        if (!connectedReader) throw new Error('No reader connected');

        console.log('📝 Creating payment intent...');
        const piResponse = await fetch(`${BASE_URL}/v1/stripe/payment-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, currency, stripeAccountId }),
        });

        const piData = await piResponse.json();
        if (!piResponse.ok) throw new Error(piData.error || 'Failed to create payment intent');
        console.log('✅ Payment intent created:', piData.paymentIntentId);

        console.log('💳 Collecting payment method...');
        const { paymentIntent: collectedPI, error: collectError } = await collectPaymentMethod({
          paymentIntent: piData.client_secret,
        });
        if (collectError) throw new Error(collectError.message);
        console.log('✅ Payment method collected');

        console.log('🔒 Confirming payment...');
        const { paymentIntent: confirmedPI, error: confirmError } = await confirmPaymentIntent({
          paymentIntent: collectedPI,
        });
        if (confirmError) throw new Error(confirmError.message);
        console.log('✅ Payment confirmed:', confirmedPI.id);

        return {
          success: true,
          paymentIntent: confirmedPI,
          amount: confirmedPI.amount,
          currency: confirmedPI.currency,
        };
      } catch (err) {
        console.error('Payment processing error:', err);
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setIsProcessing(false);
      }
    },
    [connectedReader, collectPaymentMethod, confirmPaymentIntent, stripeAccountId]
  );

  // ───────────────────────────────
  // 6️⃣ AUTO-INITIALIZE
  // ───────────────────────────────
  useEffect(() => {
    if (!isInitialized && stripeAccountId) {
      initializeTerminal();
    }
  }, [isInitialized, stripeAccountId, initializeTerminal]);

  // ───────────────────────────────
  // RETURN API
  // ───────────────────────────────
  return {
    isInitialized,
    connectedReader,
    discoveredReaders,
    isDiscovering,
    isConnecting,
    isProcessing,
    error,
    locationId,

    initializeTerminal,
    ensureLocation,
    discoverLocalMobileReader,
    discoverBluetoothReaders,
    connectToLocalMobile,
    connectToBluetoothReader,
    disconnect,
    processPayment,
  };
}
