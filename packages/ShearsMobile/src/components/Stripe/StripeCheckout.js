// src/screens/TerminalPaymentScreen.jsx
import React, { useState, useEffect } from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Button, Text, Card, useTheme } from "react-native-paper";
import { useStripeTerminal } from "@stripe/stripe-terminal-react-native";
import { createTerminalPaymentIntent } from "shears-shared/src/Services/Authentication";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function TerminalPaymentScreen() {
  const theme = useTheme();
  const { user, token } = useContext(AuthContext);

  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("Idle");
  const [connectedReader, setConnectedReader] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    initialize,
    discoverReaders,
    connectReader,
    connectedReader: terminalConnectedReader,
    createPaymentIntent: terminalCreatePI,
    collectPaymentMethod,
    confirmPaymentIntent,
  } = useStripeTerminal({
    onUpdateDiscoveredReaders: (list) => {
      console.log("🟦 onUpdateDiscoveredReaders", list);
      setStatus(`Found ${list.length} reader(s)`);
      setReaders(list);
    },
    onDidChangeConnectionStatus: (s) => {
      console.log("🟪 Connection Status:", s);
    }
  });

  const [readers, setReaders] = useState([]);

  /* ------------------------------------------------------------
     1️⃣ Initialize ONCE
  ------------------------------------------------------------ */
  useEffect(() => {
    const initTerminal = async () => {
      console.log("🔵 Initializing terminal...");
      const { error } = await initialize();
      if (error) {
        console.log("❌ initialize error:", error);
        setStatus(`Init error: ${error.message}`);
      } else {
        console.log("✅ Terminal initialized");
        setStatus("Terminal Ready");
      }
    };

    initTerminal();
  }, [initialize]);

  /* ------------------------------------------------------------
     2️⃣ Reader connected event
  ------------------------------------------------------------ */
  useEffect(() => {
    console.log("🟧 terminalConnectedReader changed:", terminalConnectedReader);
    if (terminalConnectedReader) {
      setConnectedReader(terminalConnectedReader);
      setStatus(`Connected to ${terminalConnectedReader.serialNumber}`);
    }
  }, [terminalConnectedReader]);

  /* ------------------------------------------------------------
     3️⃣ Discover readers
  ------------------------------------------------------------ */
  const handleDiscoverReaders = async () => {
    setStatus("Scanning for readers...");

    console.log("🟦 Calling discoverReaders()…");
    const result = await discoverReaders({
      discoveryMethod: "bluetoothScan",
      simulated: true,
    });

    console.log("🟩 discoverReaders result:", result);

    if (result.error) {
      console.log("❌ discoverReaders error:", result.error);
      setStatus(`Scan Error: ${result.error.message}`);
      return;
    }

    // NOTE: in event-driven mode, SDK pushes discovered list
    // so we do NOT rely on result.discoveredReaders
  };

  /* ------------------------------------------------------------
     4️⃣ Connect to the first discovered reader
  ------------------------------------------------------------ */
  const handleConnectReader = async () => {
    if (!readers.length) {
      setStatus("No readers found to connect.");
      return;
    }

    const device = readers[0];
    console.log("🟨 Attempting connection to:", device);

    let result;

    // SIMULATED readers must use reader object, NOT serialNumber anymore
    result = await connectReader(
      { reader: device },
      "bluetoothScan"
    );

    console.log("🟥 connectReader result:", result);

    if (result?.error) {
      setStatus(`Connect Error: ${result.error.message}`);
      return;
    }

    setStatus(`Connected: ${result.reader.serialNumber}`);
  };

  /* ------------------------------------------------------------
     5️⃣ Process payment
  ------------------------------------------------------------ */
  const handleProcessPayment = async () => {
    if (!connectedReader) {
      setStatus("Connect a reader first!");
      return;
    }

    if (!amount) {
      setStatus("Enter amount");
      return;
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);

    if (isNaN(amountInCents)) {
      return setStatus("Invalid amount");
    }

    if (amountInCents < 50) {
      return setStatus("Amount must be at least $0.50");
    }

    try {
      setIsLoading(true);
      setStatus("Creating PaymentIntent...");

      // Create PaymentIntent on your backend
      const backendPI = await createTerminalPaymentIntent({
        amount: amountInCents,
        stripeAccountId: user.stripeAccountId,
        token,
      });

      console.log("🟦 Backend PI:", backendPI);

      const { paymentIntent, error: intentError } = await terminalCreatePI({
        clientSecret: backendPI.client_secret,
      });

      console.log("🟧 terminalCreatePI:", { paymentIntent, intentError });

      if (intentError) {
        setStatus(`PI Error: ${intentError.message}`);
        return;
      }

      setStatus("Collecting payment…");

      const { paymentIntent: collected, error: collectError } =
        await collectPaymentMethod({
          paymentIntent,
          updatePaymentIntent: true,
        });

      console.log("🟥 collectPaymentMethod:", { collected, collectError });

      if (collectError) {
        setStatus(`Collect Error: ${collectError.message}`);
        return;
      }

      setStatus("Confirming payment…");

      const { error: confirmError } = await confirmPaymentIntent({
        paymentIntent: collected,
      });

      console.log("🟩 confirmPaymentIntent:", confirmError);

      if (confirmError) {
        setStatus(`Confirm Error: ${confirmError.message}`);
        return;
      }

      setStatus("✅ Payment Successful!");

    } catch (err) {
      console.error("❌ Payment Error:", err);
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------------------------------------
     UI
  ------------------------------------------------------------ */
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text variant="titleLarge">Stripe Terminal Payment</Text>

        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="Enter amount ($)"
          keyboardType="decimal-pad"
          style={styles.input}
        />

        <Text>Status: {status}</Text>

        {!connectedReader && (
          <View>
            <Button
              mode="contained"
              style={styles.button}
              onPress={handleDiscoverReaders}
            >
              Discover Readers
            </Button>

            <Button
              mode="contained"
              style={styles.button}
              onPress={handleConnectReader}
              disabled={!readers.length}
            >
              Connect First Reader
            </Button>
          </View>
        )}

        {connectedReader && (
          <Button
            mode="contained"
            style={styles.payButton}
            onPress={handleProcessPayment}
            loading={isLoading}
          >
            Charge ${amount || 0}
          </Button>
        )}
      </Card>
    </View>
  );
}

/* ------------------------------------------------------------
   Styles
------------------------------------------------------------ */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  card: { padding: 20 },
  input: {
    marginVertical: 16,
    padding: 12,
    fontSize: 20,
    borderWidth: 1,
    borderRadius: 8,
  },
  button: { marginTop: 12 },
  payButton: { marginTop: 20 },
});
