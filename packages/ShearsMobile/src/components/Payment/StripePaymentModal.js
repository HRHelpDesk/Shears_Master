// StripePaymentModal.jsx
import React, { useState, useContext, useEffect } from "react";
import { View, Modal, ActivityIndicator, StyleSheet } from "react-native";
import { Text, Button, Card, TouchableRipple, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { CardField, useConfirmPayment } from "@stripe/stripe-react-native";
import { useStripeTerminal } from "@stripe/stripe-terminal-react-native";

import { createManualPaymentIntent } from "shears-shared/src/Services/Authentication";
import { AuthContext } from "../../context/AuthContext";

export default function StripePaymentModal({
  visible,
  amount,
  onClose,
  onSuccess,
  onFailure,
}) {
  const theme = useTheme();
  const { user, token } = useContext(AuthContext);

  const [step, setStep] = useState("menu"); // menu | manual | reader
  const [cardDetails, setCardDetails] = useState(null);
  const [searching, setSearching] = useState(false);
  const [connecting, setConnecting] = useState(false);

  /* ---------------------------------------------------------
      Stripe Terminal Hooks
  --------------------------------------------------------- */
  const {
    initialize,
    discoverReaders,
    connectReader,
    connectedReader,
    discoveredReaders,
    createPaymentIntent,
    collectPaymentMethod,
    confirmPaymentIntent,
  } = useStripeTerminal({
    onUpdateDiscoveredReaders: (readers) => {
      console.log("📡 Discovered:", readers);
    },
    onDidChangeConnectionStatus: (status) => {
      console.log("🔄 Terminal Status:", status);
    },
  });

  const { confirmPayment, loading: manualLoading } = useConfirmPayment();

  /* ---------------------------------------------------------
      Auto-hide “searching” when readers appear
  --------------------------------------------------------- */
  useEffect(() => {
    if (searching && discoveredReaders.length > 0) {
      console.log("📡 Readers discovered — stopping searching UI");
      setSearching(false);
    }
  }, [searching, discoveredReaders]);

  /* ---------------------------------------------------------
      Initialize Terminal ONLY once
  --------------------------------------------------------- */
  useEffect(() => {
    const init = async () => {
      console.log("⚡ Initializing Stripe Terminal…");
      const { error } = await initialize();
      if (error) console.log("❌ Terminal init failed:", error);
      else console.log("✅ Terminal initialized");
    };
    init();
  }, []);

  /* ---------------------------------------------------------
      Start discovery
  --------------------------------------------------------- */
  const searchForReader = async () => {
    console.log("🔍 Searching for simulated readers…");
    setStep("reader");
    setSearching(true);
    setConnecting(false);

    const { error } = await discoverReaders({
      discoveryMethod: "simulated",
    });

    if (error) {
      console.log("❌ Discovery error:", error);
      onFailure(error);
      setSearching(false);
    }
  };

  /* ---------------------------------------------------------
      Connect to selected reader
  --------------------------------------------------------- */
  const connectToReader = async (reader) => {
    console.log("🔗 Connecting to:", reader);
    setConnecting(true);

    const { error } = await connectReader(reader);

    setConnecting(false);

    if (error) {
      console.log("❌ Failed to connect:", error);
      onFailure(error);
      return;
    }

    console.log("✅ Reader connected:", reader);
  };

  /* ---------------------------------------------------------
      TERMINAL PAYMENT FLOW (Correct flow)
  --------------------------------------------------------- */
  const handleReaderPayment = async () => {
    try {
      console.log("💳 Terminal payment started…");

      // 1️⃣ Create Terminal Payment Intent (NOT your backend!)
      const { paymentIntent, error: intentError } = await createPaymentIntent({
        amount,
        currency: "usd",
        captureMethod: "automatic",
      });

      if (intentError) throw intentError;
      console.log("🧾 Created Terminal Intent:", paymentIntent);

      // 2️⃣ Collect Payment Method (reader interaction)
      const {
        paymentIntent: collectedIntent,
        error: collectError,
      } = await collectPaymentMethod({
        paymentIntent,
        updatePaymentIntent: true,
      });

      if (collectError) throw collectError;
      console.log("📥 Collected Payment Method");

      // 3️⃣ Confirm Payment
      const {
        paymentIntent: confirmedIntent,
        error: confirmError,
      } = await confirmPaymentIntent({
        paymentIntent: collectedIntent,
      });

      if (confirmError) throw confirmError;

      console.log("🎉 Reader Payment Complete:", confirmedIntent);
      onSuccess(amount, confirmedIntent);
      onClose();
    } catch (err) {
      console.error("❌ Terminal Payment Error:", err);
      onFailure(err);
    }
  };

  /* ---------------------------------------------------------
      MANUAL CARD ENTRY FLOW
  --------------------------------------------------------- */
  const handleManualPayment = async () => {
    if (!cardDetails?.complete) return alert("Enter complete card details");

    try {
      const intent = await createManualPaymentIntent({
        amount,
        stripeAccountId: user.stripeAccountId,
        token,
      });

      const { paymentIntent, error } = await confirmPayment(intent.clientSecret, {
        paymentMethodType: "Card",
        paymentMethodData: {
          billingDetails: {
            name: user.fullName,
            email: user.email,
          },
        },
      });

      if (error) return onFailure(error);

      onSuccess(amount, paymentIntent);
      onClose();
    } catch (err) {
      onFailure(err);
    }
  };

  /* ---------------------------------------------------------
      UI SCREENS
  --------------------------------------------------------- */

  const renderMenu = () => (
    <View>
      <Text style={styles.menuTitle}>Choose Payment Method</Text>

      <View style={styles.menuGrid}>
        <TouchableRipple onPress={() => setStep("manual")} style={styles.optionCard}>
          <View style={styles.optionInner}>
            <MaterialCommunityIcons name="credit-card-outline" size={40} color={theme.colors.primary} />
            <Text style={styles.optionLabel}>Manual Entry</Text>
          </View>
        </TouchableRipple>

        <TouchableRipple onPress={searchForReader} style={styles.optionCard}>
          <View style={styles.optionInner}>
            <MaterialCommunityIcons name="credit-card-wireless" size={40} color={theme.colors.primary} />
            <Text style={styles.optionLabel}>Card Reader</Text>
          </View>
        </TouchableRipple>
      </View>

      <Button onPress={onClose} style={{ marginTop: 10 }}>Cancel</Button>
    </View>
  );

  const renderReader = () => {
    return (
      <View>
        <Text style={styles.infoText}>Simulated Readers</Text>

        {/* Searching */}
        {searching && (
          <View style={{ alignItems: "center", marginVertical: 20 }}>
            <ActivityIndicator size="large" />
            <Text>Searching for readers…</Text>
          </View>
        )}

        {/* List Readers */}
        {!searching && discoveredReaders.length > 0 && !connectedReader && (
          <View>
            <Text style={[styles.infoText, { marginBottom: 10 }]}>
              Select a reader to connect:
            </Text>

            {discoveredReaders.map((reader, index) => (
              <TouchableRipple
                key={index}
                style={styles.readerItem}
                onPress={() => connectToReader(reader)}
              >
                <View style={styles.readerRow}>
                  <MaterialCommunityIcons
                    name="credit-card-wireless"
                    size={30}
                    color={theme.colors.primary}
                  />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={{ fontWeight: "600" }}>
                      {reader.deviceType}
                    </Text>
                    <Text>{reader.serialNumber}</Text>
                  </View>
                </View>
              </TouchableRipple>
            ))}
          </View>
        )}

        {/* Connected */}
        {connectedReader && (
          <View>
            <Text style={styles.infoText}>
              Connected to {connectedReader.deviceType}
            </Text>

            <Button mode="contained" onPress={handleReaderPayment}>
              Start Reader Payment
            </Button>

            <Button onPress={() => setStep("menu")} style={{ marginTop: 10 }}>
              Back
            </Button>
          </View>
        )}

        {!connectedReader && !searching && (
          <Button onPress={() => setStep("menu")} style={{ marginTop: 10 }}>
            Back
          </Button>
        )}
      </View>
    );
  };

  const renderManual = () => (
    <View>
      <Text style={styles.infoText}>Enter Card Details</Text>

      <CardField
        postalCodeEnabled
        onCardChange={setCardDetails}
        style={{ height: 55, marginVertical: 20 }}
      />

      {manualLoading ? (
        <ActivityIndicator />
      ) : (
        <Button mode="contained" disabled={!cardDetails?.complete} onPress={handleManualPayment}>
          Pay ${(amount / 100).toFixed(2)}
        </Button>
      )}

      <Button onPress={() => setStep("menu")} style={{ marginTop: 10 }}>
        Back
      </Button>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <Card style={styles.card}>
          {step === "menu" && renderMenu()}
          {step === "manual" && renderManual()}
          {step === "reader" && renderReader()}
        </Card>
      </View>
    </Modal>
  );
}

/* ---------------------------------------------------------
   Styles
--------------------------------------------------------- */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    padding: 20,
    borderRadius: 16,
  },
  menuTitle: {
    textAlign: "center",
    fontSize: 20,
    marginBottom: 20,
    fontWeight: "600",
  },
  menuGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  optionCard: {
    width: "48%",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: "center",
  },
  optionInner: { alignItems: "center" },
  optionLabel: {
    marginTop: 10,
    fontWeight: "500",
  },
  infoText: {
    textAlign: "center",
    marginBottom: 20,
  },
  readerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  readerItem: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
  },
});
